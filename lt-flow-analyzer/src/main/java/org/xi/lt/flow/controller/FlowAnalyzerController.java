package org.xi.lt.flow.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.xi.lt.flow.diff.*;
import org.xi.lt.flow.export.ExportService;
import org.xi.lt.flow.generator.FlowToSequenceDiagramConverter;
import org.xi.lt.flow.generator.PlantUmlCallChainGenerator;
import org.xi.lt.flow.generator.PlantUmlClassDiagramGenerator;
import org.xi.lt.flow.generator.UmlSequenceDiagramGenerator;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.UmlClassDiagram;
import org.xi.lt.flow.model.UmlSequenceDiagram;
import org.xi.lt.flow.parser.JavaCodeParser;
import org.xi.lt.flow.parser.UmlClassParser;
import org.xi.lt.flow.service.*;
import org.xi.lt.flow.dynamic.InMemorySpanStore;
import org.xi.lt.flow.dynamic.SpanToFlowGraphConverter;
import org.xi.lt.flow.staticfilter.StaticFilterConfig;
import org.xi.lt.flow.staticmodel.MethodEntry;
import org.xi.lt.flow.staticparser.EnhancedJavaCodeParser;
import org.xi.lt.flow.staticparser.ProjectParser;
import org.xi.lt.flow.theme.ChartTheme;
import org.xi.lt.flow.theme.ThemeInfo;
import org.xi.lt.flow.theme.ThemesResponse;
import org.xi.lt.server.domain.model.span.SpanView;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 流程图分析器REST API控制器
 * 支持多种流程图类型：方法调用链、UML类图等
 */
@Slf4j
@RestController
@RequestMapping("/api/flow")
@CrossOrigin(origins = "*")
public class FlowAnalyzerController {

    @Value("${flow.upload.dir:./uploads}")
    private String uploadDir;

    @Autowired
    private PlantUmlService plantUmlService;

    @Autowired
    private InMemorySpanStore spanStore;

    @Autowired
    private SpanToFlowGraphConverter spanConverter;

    @Autowired
    private GitRepositoryService gitRepositoryService;

    @Autowired
    private ExportService exportService;

    @Autowired
    private JarFileService jarFileService;

    @Autowired
    private LocalSourceService localSourceService;

    private final JavaCodeParser parser = new JavaCodeParser();
    private final EnhancedJavaCodeParser enhancedParser = new EnhancedJavaCodeParser();
    private final PlantUmlCallChainGenerator generator = new PlantUmlCallChainGenerator();
    private final FlowGraphDiffService diffService = new FlowGraphDiffService();

    // 缓存解析结果，用于差异对比
    private final Map<String, FlowGraph> graphCache = new ConcurrentHashMap<>();

    private final UmlClassParser umlParser = new UmlClassParser();
    private final PlantUmlClassDiagramGenerator umlGenerator = new PlantUmlClassDiagramGenerator();
    private final FlowToSequenceDiagramConverter sequenceConverter = new FlowToSequenceDiagramConverter();
    private final UmlSequenceDiagramGenerator sequenceGenerator = new UmlSequenceDiagramGenerator();
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("service", "Flow Analyzer");
        result.put("version", "2.0.0");
        return result;
    }

    // ==================== 增强版静态分析 API ====================

    /**
     * 提取文件中的入口方法列表
     */
    @PostMapping("/entry-methods")
    public Map<String, Object> extractEntryMethods(@RequestParam("file") MultipartFile file) {
        log.info("提取入口方法: {}", file.getOriginalFilename());
        Map<String, Object> result = new HashMap<>();

        try {
            // 保存文件
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String savedFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            // 提取入口方法
            List<MethodEntry> entries = enhancedParser.extractEntryMethods(savedFilePath.toFile());

            result.put("success", true);
            result.put("entryMethods", entries);
            result.put("tempFile", savedFilename);

            // 清理文件
            Files.deleteIfExists(savedFilePath);

        } catch (Exception e) {
            log.error("提取入口方法失败", e);
            result.put("success", false);
            result.put("message", "提取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 上传并解析单个Java文件（增强版，支持入口方法选择和深度控制）
     */
    @PostMapping("/upload/file-enhanced")
    public Map<String, Object> uploadAndParseFileEnhanced(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "entryMethodId", required = false) String entryMethodId,
            @RequestParam(value = "maxDepth", required = false, defaultValue = "5") int maxDepth,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeConstructors", required = false, defaultValue = "true") boolean excludeConstructors,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt,
            @RequestParam(value = "excludeTestMethods", required = false, defaultValue = "false") boolean excludeTestMethods,
            @RequestParam(value = "excludeStaticMethods", required = false, defaultValue = "false") boolean excludeStaticMethods,
            @RequestParam(value = "excludePrivateMethods", required = false, defaultValue = "false") boolean excludePrivateMethods,
            @RequestParam(value = "excludeCollectionMethods", required = false, defaultValue = "false") boolean excludeCollectionMethods,
            @RequestParam(value = "excludeStringMethods", required = false, defaultValue = "false") boolean excludeStringMethods,
            @RequestParam(value = "theme", required = false, defaultValue = "DEFAULT") String themeName) {
        log.info("收到增强版文件上传请求: {}, 入口: {}, 深度: {}, 主题: {}",
                file.getOriginalFilename(), entryMethodId, maxDepth, themeName);

        Map<String, Object> result = new HashMap<>();

        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 保存文件
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            log.info("文件保存成功: {}", savedFilePath);

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setMaxDepth(maxDepth);
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);
            filterConfig.setExcludeTestMethods(excludeTestMethods);
            filterConfig.setExcludeStaticMethods(excludeStaticMethods);
            filterConfig.setExcludePrivateMethods(excludePrivateMethods);
            filterConfig.setExcludeCollectionMethods(excludeCollectionMethods);
            filterConfig.setExcludeStringMethods(excludeStringMethods);

            // 使用增强解析器
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFileFromEntry(savedFilePath.toFile(), entryMethodId);

            // 生成PlantUML格式
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);

            // 保存PlantUML文件
            String plantUmlFilename = savedFilename + ".puml";
            Path plantUmlFilePath = uploadPath.resolve(plantUmlFilename);
            generator.saveToFile(graph, plantUmlFilePath.toFile());

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 缓存图用于对比
            String graphId = UUID.randomUUID().toString();
            graphCache.put(graphId, graph);

            // 构建返回结果
            result.put("success", true);
            result.put("message", "解析成功");
            result.put("graphId", graphId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("graphName", graph.getName());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("plantUmlFileUrl", "/api/flow/download/" + plantUmlFilename);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("增强版文件解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("增强版文件解析失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 直接解析字符串代码（增强版）
     */
    @PostMapping("/parse/code-enhanced")
    public Map<String, Object> parseCodeEnhanced(@RequestBody Map<String, Object> request) {
        log.info("收到增强版代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = (String) request.get("code");
            String style = request.get("style") != null ? (String) request.get("style") : "ACTIVITY";
            String themeName = request.get("theme") != null ? (String) request.get("theme") : "DEFAULT";
            String entryMethodId = request.get("entryMethodId") != null ? (String) request.get("entryMethodId") : null;
            Integer maxDepthObj = request.get("maxDepth") != null ? (Integer) request.get("maxDepth") : 5;
            int maxDepth = maxDepthObj != null ? maxDepthObj : 5;
            Boolean excludeJdkObj = request.get("excludeJdk") != null ? (Boolean) request.get("excludeJdk") : true;
            boolean excludeJdk = excludeJdkObj != null ? excludeJdkObj : true;
            Boolean excludeLoggingObj = request.get("excludeLogging") != null ? (Boolean) request.get("excludeLogging") : true;
            boolean excludeLogging = excludeLoggingObj != null ? excludeLoggingObj : true;
            Boolean excludeGetterSetterObj = request.get("excludeGetterSetter") != null ? (Boolean) request.get("excludeGetterSetter") : true;
            boolean excludeGetterSetter = excludeGetterSetterObj != null ? excludeGetterSetterObj : true;
            Boolean excludeConstructorsObj = request.get("excludeConstructors") != null ? (Boolean) request.get("excludeConstructors") : true;
            boolean excludeConstructors = excludeConstructorsObj != null ? excludeConstructorsObj : true;
            Boolean excludeBuilderMethodsObj = request.get("excludeBuilderMethods") != null ? (Boolean) request.get("excludeBuilderMethods") : true;
            boolean excludeBuilderMethods = excludeBuilderMethodsObj != null ? excludeBuilderMethodsObj : true;
            Boolean excludeLombokMethodsObj = request.get("excludeLombokMethods") != null ? (Boolean) request.get("excludeLombokMethods") : true;
            boolean excludeLombokMethods = excludeLombokMethodsObj != null ? excludeLombokMethodsObj : true;
            Boolean excludeLtObj = request.get("excludeLt") != null ? (Boolean) request.get("excludeLt") : true;
            boolean excludeLt = excludeLtObj != null ? excludeLtObj : true;
            Boolean excludeTestMethodsObj = request.get("excludeTestMethods") != null ? (Boolean) request.get("excludeTestMethods") : false;
            boolean excludeTestMethods = excludeTestMethodsObj != null ? excludeTestMethodsObj : false;
            Boolean excludeStaticMethodsObj = request.get("excludeStaticMethods") != null ? (Boolean) request.get("excludeStaticMethods") : false;
            boolean excludeStaticMethods = excludeStaticMethodsObj != null ? excludeStaticMethodsObj : false;
            Boolean excludePrivateMethodsObj = request.get("excludePrivateMethods") != null ? (Boolean) request.get("excludePrivateMethods") : false;
            boolean excludePrivateMethods = excludePrivateMethodsObj != null ? excludePrivateMethodsObj : false;
            Boolean excludeCollectionMethodsObj = request.get("excludeCollectionMethods") != null ? (Boolean) request.get("excludeCollectionMethods") : false;
            boolean excludeCollectionMethods = excludeCollectionMethodsObj != null ? excludeCollectionMethodsObj : false;
            Boolean excludeStringMethodsObj = request.get("excludeStringMethods") != null ? (Boolean) request.get("excludeStringMethods") : false;
            boolean excludeStringMethods = excludeStringMethodsObj != null ? excludeStringMethodsObj : false;

            if (code == null || code.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "代码不能为空");
                return result;
            }

            // 创建临时文件
            Path tempDir = Paths.get(uploadDir);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            String tempFilename = UUID.randomUUID().toString() + ".java";
            Path tempFile = tempDir.resolve(tempFilename);
            Files.write(tempFile, code.getBytes("UTF-8"));

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setMaxDepth(maxDepth);
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);
            filterConfig.setExcludeTestMethods(excludeTestMethods);
            filterConfig.setExcludeStaticMethods(excludeStaticMethods);
            filterConfig.setExcludePrivateMethods(excludePrivateMethods);
            filterConfig.setExcludeCollectionMethods(excludeCollectionMethods);
            filterConfig.setExcludeStringMethods(excludeStringMethods);

            // 使用增强解析器
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFileFromEntry(tempFile.toFile(), entryMethodId);

            // 生成PlantUML格式
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 缓存图用于对比
            String graphId = UUID.randomUUID().toString();
            graphCache.put(graphId, graph);

            // 构建返回结果
            result.put("success", true);
            result.put("message", "解析成功");
            result.put("graphId", graphId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            // 清理临时文件
            Files.deleteIfExists(tempFile);

            log.info("增强版代码解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("增强版代码解析失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }
    
    /**
     * 上传并解析单个Java文件
     */
    @PostMapping("/upload/file")
    public Map<String, Object> uploadAndParseFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "filterJdk", required = false, defaultValue = "true") boolean filterJdk) {
        log.info("收到文件上传请求: {}, 样式: {}, 过滤JDK: {}",
                file.getOriginalFilename(), style, filterJdk);

        Map<String, Object> result = new HashMap<>();

        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 保存文件
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            log.info("文件保存成功: {}", savedFilePath);

            // 解析文件
            FlowGraph graph = parser.parseFile(savedFilePath.toFile());

            // 生成PlantUML格式
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle);

            // 保存PlantUML文件
            String plantUmlFilename = savedFilename + ".puml";
            Path plantUmlFilePath = uploadPath.resolve(plantUmlFilename);
            generator.saveToFile(graph, plantUmlFilePath.toFile());

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "解析成功");
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("graphName", graph.getName());
            result.put("dotContent", plantUmlContent);  // 保持字段名兼容
            result.put("plantUmlContent", plantUmlContent);
            result.put("plantUmlFileUrl", "/api/flow/download/" + plantUmlFilename);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("文件解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("文件解析失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }
    
    /**
     * 上传并解析目录（ZIP文件）
     */
    @PostMapping("/upload/zip")
    public Map<String, Object> uploadAndParseZip(@RequestParam("file") MultipartFile file) {
        log.info("收到ZIP文件上传请求: {}", file.getOriginalFilename());
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // 保存ZIP文件
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedZipPath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedZipPath);
            
            // 解压ZIP文件
            String extractDirName = savedFilename + "_extracted";
            Path extractDir = uploadPath.resolve(extractDirName);
            if (!Files.exists(extractDir)) {
                Files.createDirectories(extractDir);
            }
            
            // 这里简化处理，实际应该解压ZIP
            // 先不实现解压，只返回提示
            result.put("success", true);
            result.put("message", "ZIP文件上传成功，目录解析功能开发中...");
            result.put("zipFile", savedFilename);
            
        } catch (Exception e) {
            log.error("ZIP文件处理失败", e);
            result.put("success", false);
            result.put("message", "处理失败: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 下载生成的DOT文件
     */
    @GetMapping("/download/{filename}")
    public org.springframework.core.io.Resource downloadDotFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            if (!Files.exists(filePath)) {
                throw new RuntimeException("文件不存在: " + filename);
            }
            
            return new org.springframework.core.io.UrlResource(filePath.toUri());
            
        } catch (Exception e) {
            log.error("文件下载失败", e);
            throw new RuntimeException("文件下载失败: " + e.getMessage());
        }
    }
    
    /**
     * 直接解析字符串代码（用于测试）
     */
    @PostMapping("/parse/code")
    public Map<String, Object> parseCode(@RequestBody Map<String, Object> request) {
        log.info("收到代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = (String) request.get("code");
            String style = request.get("style") != null ? (String) request.get("style") : "ACTIVITY";
            boolean filterJdk = request.get("filterJdk") != null ? (Boolean) request.get("filterJdk") : true;

            if (code == null || code.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "代码不能为空");
                return result;
            }

            // 创建临时文件
            Path tempDir = Paths.get(uploadDir);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            String tempFilename = UUID.randomUUID().toString() + ".java";
            Path tempFile = tempDir.resolve(tempFilename);
            Files.write(tempFile, code.getBytes("UTF-8"));

            // 解析文件
            FlowGraph graph = parser.parseFile(tempFile.toFile());

            // 生成PlantUML格式
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle);

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "解析成功");
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("dotContent", plantUmlContent);  // 保持字段名兼容
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            // 清理临时文件
            Files.deleteIfExists(tempFile);

            log.info("代码解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("代码解析失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }
    
    // ==================== UML 类图相关 API ====================

    /**
     * 上传文件并生成 UML 类图
     */
    @PostMapping("/uml/upload/file")
    public Map<String, Object> uploadAndGenerateUmlClassDiagram(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeConstructors", required = false, defaultValue = "true") boolean excludeConstructors,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt) {
        log.info("收到 UML 类图文件上传请求: {}", file.getOriginalFilename());

        Map<String, Object> result = new HashMap<>();

        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 保存文件
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            log.info("文件保存成功: {}", savedFilePath);

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            // 解析文件，生成 UML 类图
            UmlClassParser umlParserWithConfig = new UmlClassParser(filterConfig);
            UmlClassDiagram diagram = umlParserWithConfig.parseFile(savedFilePath.toFile());

            // 生成 PlantUML 格式
            String plantUmlContent = umlGenerator.generatePlantUml(diagram);

            // 保存 PlantUML 文件
            String plantUmlFilename = savedFilename + ".uml.puml";
            Path plantUmlFilePath = uploadPath.resolve(plantUmlFilename);
            umlGenerator.saveToFile(diagram, plantUmlFilePath.toFile());

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "UML 类图生成成功");
            result.put("classCount", diagram.getClasses().size());
            result.put("relationshipCount", diagram.getRelationships().size());
            result.put("dotContent", plantUmlContent);  // 保持字段名兼容
            result.put("plantUmlContent", plantUmlContent);
            result.put("plantUmlFilename", plantUmlFilename);
            result.put("graphData", buildUmlGraphData(diagram));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("UML 类图生成成功！类数: {}, 关系数: {}",
                    diagram.getClasses().size(), diagram.getRelationships().size());

        } catch (Exception e) {
            log.error("UML 类图生成失败", e);
            result.put("success", false);
            result.put("message", "UML 类图生成失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 直接解析代码并生成 UML 类图
     */
    @PostMapping("/uml/parse/code")
    public Map<String, Object> parseCodeAndGenerateUml(@RequestBody Map<String, Object> request) {
        log.info("收到 UML 类图代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = (String) request.get("code");
            if (code == null || code.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "代码不能为空");
                return result;
            }

            // 提取过滤参数
            Boolean excludeJdkObj = request.get("excludeJdk") != null ? (Boolean) request.get("excludeJdk") : true;
            boolean excludeJdk = excludeJdkObj != null ? excludeJdkObj : true;
            Boolean excludeLoggingObj = request.get("excludeLogging") != null ? (Boolean) request.get("excludeLogging") : true;
            boolean excludeLogging = excludeLoggingObj != null ? excludeLoggingObj : true;
            Boolean excludeGetterSetterObj = request.get("excludeGetterSetter") != null ? (Boolean) request.get("excludeGetterSetter") : true;
            boolean excludeGetterSetter = excludeGetterSetterObj != null ? excludeGetterSetterObj : true;
            Boolean excludeConstructorsObj = request.get("excludeConstructors") != null ? (Boolean) request.get("excludeConstructors") : true;
            boolean excludeConstructors = excludeConstructorsObj != null ? excludeConstructorsObj : true;
            Boolean excludeBuilderMethodsObj = request.get("excludeBuilderMethods") != null ? (Boolean) request.get("excludeBuilderMethods") : true;
            boolean excludeBuilderMethods = excludeBuilderMethodsObj != null ? excludeBuilderMethodsObj : true;
            Boolean excludeLombokMethodsObj = request.get("excludeLombokMethods") != null ? (Boolean) request.get("excludeLombokMethods") : true;
            boolean excludeLombokMethods = excludeLombokMethodsObj != null ? excludeLombokMethodsObj : true;
            Boolean excludeLtObj = request.get("excludeLt") != null ? (Boolean) request.get("excludeLt") : true;
            boolean excludeLt = excludeLtObj != null ? excludeLtObj : true;

            // 创建临时文件
            Path tempDir = Paths.get(uploadDir);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            String tempFilename = UUID.randomUUID().toString() + ".java";
            Path tempFile = tempDir.resolve(tempFilename);
            Files.write(tempFile, code.getBytes("UTF-8"));

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            // 解析文件，生成 UML 类图
            UmlClassParser umlParserWithConfig = new UmlClassParser(filterConfig);
            UmlClassDiagram diagram = umlParserWithConfig.parseFile(tempFile.toFile());

            // 生成 PlantUML 格式
            String plantUmlContent = umlGenerator.generatePlantUml(diagram);

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "UML 类图生成成功");
            result.put("classCount", diagram.getClasses().size());
            result.put("relationshipCount", diagram.getRelationships().size());
            result.put("dotContent", plantUmlContent);  // 保持字段名兼容
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildUmlGraphData(diagram));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            // 清理临时文件
            Files.deleteIfExists(tempFile);

            log.info("UML 类图代码解析成功！类数: {}, 关系数: {}",
                    diagram.getClasses().size(), diagram.getRelationships().size());

        } catch (Exception e) {
            log.error("UML 类图代码解析失败", e);
            result.put("success", false);
            result.put("message", "UML 类图解析失败: " + e.getMessage());
        }

        return result;
    }

    // ==================== UML 时序图相关 API ====================

    /**
     * 上传文件并生成 UML 时序图
     */
    @PostMapping("/sequence/upload/file")
    public Map<String, Object> uploadAndGenerateSequenceDiagram(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeConstructors", required = false, defaultValue = "true") boolean excludeConstructors,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt) {
        log.info("收到 UML 时序图文件上传请求: {}", file.getOriginalFilename());

        Map<String, Object> result = new HashMap<>();

        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 保存文件
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            log.info("文件保存成功: {}", savedFilePath);

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            // 解析文件，生成调用链 FlowGraph
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFile(savedFilePath.toFile());

            // 转换为时序图
            UmlSequenceDiagram diagram = sequenceConverter.convert(graph);

            // 生成 PlantUML 格式
            String plantUmlContent = sequenceGenerator.generatePlantUml(diagram);

            // 保存 PlantUML 文件
            String plantUmlFilename = savedFilename + ".sequence.puml";
            Path plantUmlFilePath = uploadPath.resolve(plantUmlFilename);
            sequenceGenerator.saveToFile(diagram, plantUmlFilePath.toFile());

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "UML 时序图生成成功");
            result.put("participantCount", diagram.getParticipants().size());
            result.put("messageCount", diagram.getMessages().size());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("plantUmlFilename", plantUmlFilename);
            result.put("graphData", buildSequenceGraphData(diagram));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("UML 时序图生成成功！参与者数: {}, 消息数: {}",
                    diagram.getParticipants().size(), diagram.getMessages().size());

        } catch (Exception e) {
            log.error("UML 时序图生成失败", e);
            result.put("success", false);
            result.put("message", "UML 时序图生成失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 直接解析代码并生成 UML 时序图
     */
    @PostMapping("/sequence/parse/code")
    public Map<String, Object> parseCodeAndGenerateSequence(@RequestBody Map<String, Object> request) {
        log.info("收到 UML 时序图代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = (String) request.get("code");
            if (code == null || code.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "代码不能为空");
                return result;
            }

            // 提取过滤参数
            Boolean excludeJdkObj = request.get("excludeJdk") != null ? (Boolean) request.get("excludeJdk") : true;
            boolean excludeJdk = excludeJdkObj != null ? excludeJdkObj : true;
            Boolean excludeLoggingObj = request.get("excludeLogging") != null ? (Boolean) request.get("excludeLogging") : true;
            boolean excludeLogging = excludeLoggingObj != null ? excludeLoggingObj : true;
            Boolean excludeGetterSetterObj = request.get("excludeGetterSetter") != null ? (Boolean) request.get("excludeGetterSetter") : true;
            boolean excludeGetterSetter = excludeGetterSetterObj != null ? excludeGetterSetterObj : true;
            Boolean excludeConstructorsObj = request.get("excludeConstructors") != null ? (Boolean) request.get("excludeConstructors") : true;
            boolean excludeConstructors = excludeConstructorsObj != null ? excludeConstructorsObj : true;
            Boolean excludeBuilderMethodsObj = request.get("excludeBuilderMethods") != null ? (Boolean) request.get("excludeBuilderMethods") : true;
            boolean excludeBuilderMethods = excludeBuilderMethodsObj != null ? excludeBuilderMethodsObj : true;
            Boolean excludeLombokMethodsObj = request.get("excludeLombokMethods") != null ? (Boolean) request.get("excludeLombokMethods") : true;
            boolean excludeLombokMethods = excludeLombokMethodsObj != null ? excludeLombokMethodsObj : true;
            Boolean excludeLtObj = request.get("excludeLt") != null ? (Boolean) request.get("excludeLt") : true;
            boolean excludeLt = excludeLtObj != null ? excludeLtObj : true;

            // 创建临时文件
            Path tempDir = Paths.get(uploadDir);
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            String tempFilename = UUID.randomUUID().toString() + ".java";
            Path tempFile = tempDir.resolve(tempFilename);
            Files.write(tempFile, code.getBytes("UTF-8"));

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            // 解析文件，生成调用链 FlowGraph
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFile(tempFile.toFile());

            // 转换为时序图
            UmlSequenceDiagram diagram = sequenceConverter.convert(graph);

            // 生成 PlantUML 格式
            String plantUmlContent = sequenceGenerator.generatePlantUml(diagram);

            // 尝试渲染为Base64 PNG
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            // 构建返回结果
            result.put("success", true);
            result.put("message", "UML 时序图生成成功");
            result.put("participantCount", diagram.getParticipants().size());
            result.put("messageCount", diagram.getMessages().size());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildSequenceGraphData(diagram));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            // 清理临时文件
            Files.deleteIfExists(tempFile);

            log.info("UML 时序图代码解析成功！参与者数: {}, 消息数: {}",
                    diagram.getParticipants().size(), diagram.getMessages().size());

        } catch (Exception e) {
            log.error("UML 时序图代码解析失败", e);
            result.put("success", false);
            result.put("message", "UML 时序图解析失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 构建时序图数据（用于前端 ECharts 交互）
     */
    private Map<String, Object> buildSequenceGraphData(UmlSequenceDiagram diagram) {
        Map<String, Object> data = new HashMap<>();

        // 构建参与者节点列表
        List<Map<String, Object>> nodeList = new ArrayList<>();
        for (UmlSequenceDiagram.Participant participant : diagram.getParticipants()) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", participant.getId());
            nodeData.put("type", "PARTICIPANT");
            nodeData.put("name", participant.getName());
            nodeData.put("participantType", participant.getType() != null ? participant.getType().name() : "OBJECT");
            nodeData.put("displayName", participant.getName());
            nodeList.add(nodeData);
        }
        data.put("nodes", nodeList);

        // 构建消息边列表
        List<Map<String, Object>> edgeList = new ArrayList<>();
        for (UmlSequenceDiagram.Message message : diagram.getMessages()) {
            Map<String, Object> edgeData = new HashMap<>();
            edgeData.put("source", message.getFromParticipantId());
            edgeData.put("target", message.getToParticipantId());
            edgeData.put("sourceId", message.getFromParticipantId());
            edgeData.put("targetId", message.getToParticipantId());
            edgeData.put("sequence", message.getSequence());
            edgeData.put("name", message.getName());
            edgeData.put("messageType", message.getType() != null ? message.getType().name() : "SYNCHRONOUS");
            edgeData.put("isSelfCall", message.isSelfCall());
            edgeData.put("isReturn", message.isReturn());
            edgeList.add(edgeData);
        }
        data.put("edges", edgeList);

        return data;
    }

    // ==================== 动态 APM API ====================

    /**
     * 获取所有 Trace 列表
     */
    @GetMapping("/dynamic/traces")
    public Map<String, Object> getTraceList(
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {
        log.info("获取 Trace 列表，limit: {}", limit);
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("success", true);
            result.put("traces", spanStore.getRecentTraces(limit));
            result.put("totalCount", spanStore.getTraceCount());
        } catch (Exception e) {
            log.error("获取 Trace 列表失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 根据 Trace ID 获取 Span 列表
     */
    @GetMapping("/dynamic/trace/{traceId}")
    public Map<String, Object> getTraceSpans(@PathVariable String traceId) {
        log.info("获取 Trace 详情: {}", traceId);
        Map<String, Object> result = new HashMap<>();
        try {
            List<SpanView> spans = spanStore.findByTraceIdSorted(traceId);
            result.put("success", true);
            result.put("traceId", traceId);
            result.put("spans", spans);
            result.put("spanCount", spans.size());
        } catch (Exception e) {
            log.error("获取 Trace 详情失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 根据 Trace ID 生成流程图
     */
    @PostMapping("/dynamic/trace/{traceId}/graph")
    public Map<String, Object> generateGraphFromTrace(
            @PathVariable String traceId,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style) {
        log.info("从 Trace 生成流程图: {}, 样式: {}", traceId, style);
        Map<String, Object> result = new HashMap<>();
        try {
            List<SpanView> spans = spanStore.findByTraceIdSorted(traceId);
            if (spans.isEmpty()) {
                result.put("success", false);
                result.put("message", "未找到 Trace: " + traceId);
                return result;
            }

            // 转换为 FlowGraph
            org.xi.lt.flow.model.FlowGraph graph = spanConverter.convert(spans, traceId);

            // 生成 PlantUML
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle);

            // 尝试渲染图片
            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回 PlantUML 源码", e);
            }

            result.put("success", true);
            result.put("traceId", traceId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("plantUmlContent", plantUmlContent);
            result.put("dotContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

        } catch (Exception e) {
            log.error("从 Trace 生成流程图失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 上传 Span 数据
     */
    @PostMapping("/dynamic/spans")
    public Map<String, Object> uploadSpans(@RequestBody List<SpanView> spans) {
        log.info("上传 Span 数据，数量: {}", spans.size());
        Map<String, Object> result = new HashMap<>();
        try {
            spanStore.saveSpans(spans);
            result.put("success", true);
            result.put("message", "保存成功");
            result.put("savedCount", spans.size());
        } catch (Exception e) {
            log.error("保存 Span 数据失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 生成新的演示 Trace
     */
    @PostMapping("/dynamic/demo-trace")
    public Map<String, Object> generateDemoTrace() {
        log.info("生成演示 Trace");
        Map<String, Object> result = new HashMap<>();
        try {
            String traceId = java.util.UUID.randomUUID().toString().replace("-", "");
            List<SpanView> spans = org.xi.lt.flow.dynamic.DemoSpanGenerator.generateDemoTrace(traceId);
            spanStore.saveSpans(spans);

            result.put("success", true);
            result.put("traceId", traceId);
            result.put("spanCount", spans.size());
        } catch (Exception e) {
            log.error("生成演示 Trace 失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 清除所有数据
     */
    @DeleteMapping("/dynamic/clear")
    public Map<String, Object> clearAllData() {
        log.info("清除所有数据");
        Map<String, Object> result = new HashMap<>();
        try {
            spanStore.clear();
            result.put("success", true);
            result.put("message", "清除成功");
        } catch (Exception e) {
            log.error("清除数据失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 构建简化的图数据（用于前端交互）
     */
    private Map<String, Object> buildGraphData(org.xi.lt.flow.model.FlowGraph graph) {
        Map<String, Object> data = new HashMap<>();

        // 构建节点列表（过滤掉 -> 节点）
        Set<String> validNodeIds = new HashSet<>();
        List<Map<String, Object>> nodeList = new ArrayList<>();
        for (org.xi.lt.flow.model.FlowNode node : graph.getAllNodes()) {
            String displayName = node.getDisplayName();
            String methodName = node.getMethodName();
            // 过滤掉 -> 节点
            if ((displayName != null && (displayName.equals("->") || displayName.contains("->"))) ||
                (methodName != null && (methodName.equals("->") || methodName.contains("->")))) {
                continue;
            }
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", node.getId());
            nodeData.put("type", node.getType() != null ? node.getType().name() : "UNKNOWN");
            nodeData.put("className", node.getClassName());
            nodeData.put("methodName", node.getMethodName());
            nodeData.put("displayName", node.getDisplayName());
            nodeData.put("methodSignature", node.getMethodSignature());
            nodeData.put("metadata", node.getMetadata());
            nodeList.add(nodeData);
            validNodeIds.add(node.getId());
        }
        data.put("nodes", nodeList);

        // 构建边列表（只包含有效节点）
        List<Map<String, Object>> edgeList = new ArrayList<>();
        for (org.xi.lt.flow.model.FlowEdge edge : graph.getEdges()) {
            String sourceId = edge.getSource() != null ? edge.getSource().getId() : null;
            String targetId = edge.getTarget() != null ? edge.getTarget().getId() : null;
            // 只添加两个端点都有效的边
            if (sourceId != null && targetId != null &&
                validNodeIds.contains(sourceId) && validNodeIds.contains(targetId)) {
                Map<String, Object> edgeData = new HashMap<>();
                edgeData.put("sourceId", sourceId);
                edgeData.put("targetId", targetId);
                edgeData.put("source", sourceId);  // ECharts 需要 source
                edgeData.put("target", targetId);  // ECharts 需要 target
                edgeData.put("callType", edge.getCallType() != null ? edge.getCallType().name() : null);
                edgeData.put("callCount", edge.getCallCount());
                edgeList.add(edgeData);
            }
        }
        data.put("edges", edgeList);

        return data;
    }

    /**
     * 构建 UML 类图数据（用于前端 ECharts 交互）
     */
    private Map<String, Object> buildUmlGraphData(UmlClassDiagram diagram) {
        Map<String, Object> data = new HashMap<>();

        // 构建节点列表（类）
        List<Map<String, Object>> nodeList = new ArrayList<>();
        for (UmlClassDiagram.UmlClass clazz : diagram.getClasses()) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", clazz.getClassName());
            nodeData.put("type", "CLASS");
            nodeData.put("className", clazz.getClassName());
            nodeData.put("displayName", clazz.getSimpleName());
            nodeData.put("classType", clazz.getClassType() != null ? clazz.getClassType().name() : "CLASS");

            // 构建元数据
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("attributes", clazz.getAttributes());
            metadata.put("methods", clazz.getMethods());
            nodeData.put("metadata", metadata);

            nodeList.add(nodeData);
        }
        data.put("nodes", nodeList);

        // 构建边列表（关系）
        List<Map<String, Object>> edgeList = new ArrayList<>();
        for (UmlClassDiagram.UmlRelationship relationship : diagram.getRelationships()) {
            Map<String, Object> edgeData = new HashMap<>();
            edgeData.put("sourceId", relationship.getSourceClassName());
            edgeData.put("targetId", relationship.getTargetClassName());
            edgeData.put("callType", relationship.getType() != null ? relationship.getType().name() : "ASSOCIATION");
            edgeData.put("callCount", 1);
            edgeData.put("label", relationship.getLabel());
            edgeList.add(edgeData);
        }
        data.put("edges", edgeList);

        return data;
    }

    // ==================== 主题相关 API ====================

    /**
     * 获取所有可用主题（不带 /flow 前缀也支持）
     */
    @GetMapping("/themes")
    public ThemesResponse getThemes() {
        List<ThemeInfo> themes = new ArrayList<>();
        for (ChartTheme theme : ChartTheme.getAllThemes()) {
            themes.add(ThemeInfo.from(theme));
        }

        return ThemesResponse.builder()
                .success(true)
                .themes(themes)
                .defaultTheme("default")
                .build();
    }

    /**
     * 获取指定主题
     */
    @GetMapping("/themes/{themeName}")
    public Map<String, Object> getTheme(@PathVariable String themeName) {
        Map<String, Object> result = new HashMap<>();
        try {
            ChartTheme theme = ChartTheme.getTheme(themeName);
            result.put("success", true);
            result.put("theme", theme);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "主题不存在: " + themeName);
        }
        return result;
    }

    // ==================== 图缓存 API ====================

    /**
     * 获取缓存的图列表
     */
    @GetMapping("/diff/graphs")
    public Map<String, Object> getCachedGraphs() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> graphs = new ArrayList<>();

        for (Map.Entry<String, FlowGraph> entry : graphCache.entrySet()) {
            Map<String, Object> graphInfo = new HashMap<>();
            graphInfo.put("id", entry.getKey());
            graphInfo.put("name", entry.getValue().getName() != null ? entry.getValue().getName() : "graph_" + entry.getKey().substring(0, 8));
            graphInfo.put("nodeCount", entry.getValue().getNodeCount());
            graphInfo.put("edgeCount", entry.getValue().getEdgeCount());
            graphInfo.put("timestamp", System.currentTimeMillis());
            graphs.add(graphInfo);
        }

        result.put("success", true);
        result.put("graphs", graphs);
        return result;
    }

    /**
     * 对比两个文件
     */
    @PostMapping("/diff/compare-files")
    public DiffResultResponse compareFiles(
            @RequestParam("oldFile") MultipartFile oldFile,
            @RequestParam("newFile") MultipartFile newFile,
            @RequestParam(value = "theme", required = false, defaultValue = "DEFAULT") String themeName) {
        try {
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();

            // 解析旧文件
            Path oldPath = Paths.get(uploadDir, UUID.randomUUID().toString() + "_" + oldFile.getOriginalFilename());
            Files.copy(oldFile.getInputStream(), oldPath);
            ProjectParser parser = new ProjectParser(filterConfig);
            FlowGraph oldGraph = parser.parseFileOrFolder(oldPath.toFile());
            String oldGraphId = UUID.randomUUID().toString();
            graphCache.put(oldGraphId, oldGraph);

            // 解析新文件
            Path newPath = Paths.get(uploadDir, UUID.randomUUID().toString() + "_" + newFile.getOriginalFilename());
            Files.copy(newFile.getInputStream(), newPath);
            FlowGraph newGraph = parser.parseFileOrFolder(newPath.toFile());
            String newGraphId = UUID.randomUUID().toString();
            graphCache.put(newGraphId, newGraph);

            // 对比
            FlowGraphDiffService.DiffResult diffResult = diffService.compare(oldGraph, newGraph);
            DiffResultResponse response = diffResult.toResponse();
            response.setOldGraphId(oldGraphId);
            response.setNewGraphId(newGraphId);

            // 生成高亮对比图
            FlowGraph highlightedGraph = diffService.generateHighlightedDiffGraph(diffResult);
            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent = generator.generatePlantUml(highlightedGraph,
                    PlantUmlCallChainGenerator.DiagramStyle.ACTIVITY, theme);
            response.setHighlightedPlantUmlContent(plantUmlContent);

            try {
                String base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
                response.setHighlightedPreviewImage(base64Image);
            } catch (Exception e) {
                log.warn("高亮图渲染失败", e);
            }

            Files.deleteIfExists(oldPath);
            Files.deleteIfExists(newPath);

            return response;
        } catch (Exception e) {
            log.error("文件对比失败", e);
            return DiffResultResponse.error("文件对比失败: " + e.getMessage());
        }
    }

    // ==================== 本地项目解析 API ====================

    /**
     * 解析本地项目（FormData版本）
     */
    @PostMapping("/project/parse")
    public Map<String, Object> parseLocalProjectForm(
            @RequestParam("projectPath") String projectPath,
            @RequestParam(value = "includePackages", required = false) String includePackagesStr,
            @RequestParam(value = "excludePackages", required = false) String excludePackagesStr,
            @RequestParam(value = "flowType", required = false, defaultValue = "callChain") String flowType,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "theme", required = false, defaultValue = "DEFAULT") String themeName,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeCommonObject", required = false, defaultValue = "true") boolean excludeCommonObject,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "false") boolean excludeLt,
            @RequestParam(value = "excludeTestMethods", required = false, defaultValue = "true") boolean excludeTestMethods,
            @RequestParam(value = "excludeStaticMethods", required = false, defaultValue = "false") boolean excludeStaticMethods,
            @RequestParam(value = "excludePrivateMethods", required = false, defaultValue = "false") boolean excludePrivateMethods,
            @RequestParam(value = "excludeCollectionMethods", required = false, defaultValue = "false") boolean excludeCollectionMethods,
            @RequestParam(value = "excludeStringMethods", required = false, defaultValue = "false") boolean excludeStringMethods) {
        return parseLocalProjectImpl(projectPath, includePackagesStr, excludePackagesStr, flowType, style, themeName,
                excludeJdk, excludeLogging, excludeGetterSetter, excludeCommonObject, excludeBuilderMethods, excludeLombokMethods,
                excludeLt, excludeTestMethods, excludeStaticMethods, excludePrivateMethods, excludeCollectionMethods, excludeStringMethods);
    }

    private Map<String, Object> parseLocalProjectImpl(
            String projectPath,
            String includePackagesStr,
            String excludePackagesStr,
            String flowType,
            String style,
            String themeName,
            boolean excludeJdk,
            boolean excludeLogging,
            boolean excludeGetterSetter,
            boolean excludeCommonObject,
            boolean excludeBuilderMethods,
            boolean excludeLombokMethods,
            boolean excludeLt,
            boolean excludeTestMethods,
            boolean excludeStaticMethods,
            boolean excludePrivateMethods,
            boolean excludeCollectionMethods,
            boolean excludeStringMethods) {
        log.info("解析本地项目: {}", projectPath);
        Map<String, Object> result = new HashMap<>();

        try {
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeCommonMethods(excludeCommonObject);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);
            filterConfig.setExcludeTestMethods(excludeTestMethods);
            filterConfig.setExcludeStaticMethods(excludeStaticMethods);
            filterConfig.setExcludePrivateMethods(excludePrivateMethods);
            filterConfig.setExcludeCollectionMethods(excludeCollectionMethods);
            filterConfig.setExcludeStringMethods(excludeStringMethods);

            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent;
            String graphId = UUID.randomUUID().toString();

            if ("umlClass".equals(flowType)) {
                // 类图需要使用 UmlClassParser 逐个解析文件
                UmlClassParser classParser = new UmlClassParser(filterConfig);
                org.xi.lt.flow.model.UmlClassDiagram classDiagram =
                    new org.xi.lt.flow.model.UmlClassDiagram();
                classDiagram.setName(new File(projectPath).getName());

                // 收集所有 Java 文件
                List<File> javaFiles = collectJavaFiles(new File(projectPath));
                for (File javaFile : javaFiles) {
                    try {
                        org.xi.lt.flow.model.UmlClassDiagram singleDiagram = classParser.parseFile(javaFile);
                        // 合并类图
                        for (org.xi.lt.flow.model.UmlClassDiagram.UmlClass clazz : singleDiagram.getClasses()) {
                            classDiagram.addClass(clazz);
                        }
                        for (org.xi.lt.flow.model.UmlClassDiagram.UmlRelationship rel : singleDiagram.getRelationships()) {
                            classDiagram.addRelationship(rel);
                        }
                    } catch (Exception e) {
                        log.warn("解析文件失败: {}", javaFile.getName(), e);
                    }
                }

                plantUmlContent = umlGenerator.generatePlantUml(classDiagram);
                // 类图暂时不存入 graphCache（因为类型不匹配）
                result.put("nodeCount", classDiagram.getClasses().size());
                result.put("edgeCount", classDiagram.getRelationships().size());
                result.put("graphName", classDiagram.getName());
                // 构建类图专用的 graphData
                result.put("graphData", buildClassGraphData(classDiagram));
            } else {
                // 调用链图或时序图
                ProjectParser projectParser = new ProjectParser(filterConfig);
                FlowGraph graph = projectParser.parseProjectFolder(new File(projectPath));
                graphCache.put(graphId, graph);

                if ("sequence".equals(flowType)) {
                    org.xi.lt.flow.model.UmlSequenceDiagram sequenceDiagram = sequenceConverter.convert(graph);
                    plantUmlContent = sequenceGenerator.generatePlantUml(sequenceDiagram);
                    result.put("graphData", buildSequenceGraphData(sequenceDiagram));
                    result.put("nodeCount", sequenceDiagram.getParticipants().size());
                    result.put("edgeCount", sequenceDiagram.getMessages().size());
                } else {
                    PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                            PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
                    plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);
                    result.put("graphData", buildGraphData(graph));
                    result.put("nodeCount", graph.getNodeCount());
                    result.put("edgeCount", graph.getEdgeCount());
                }
                result.put("graphName", graph.getName());
            }

            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            result.put("success", true);
            result.put("message", "项目解析成功");
            result.put("graphId", graphId);
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("本地项目解析成功！");
        } catch (Exception e) {
            log.error("解析本地项目失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }

    private List<File> collectJavaFiles(File folder) throws IOException {
        List<File> javaFiles = new ArrayList<>();
        if (!folder.exists() || !folder.isDirectory()) {
            return javaFiles;
        }
        java.nio.file.Files.walkFileTree(folder.toPath(), new java.nio.file.SimpleFileVisitor<java.nio.file.Path>() {
            @Override
            public java.nio.file.FileVisitResult visitFile(java.nio.file.Path file, java.nio.file.attribute.BasicFileAttributes attrs) {
                if (file.toString().endsWith(".java")) {
                    javaFiles.add(file.toFile());
                }
                return java.nio.file.FileVisitResult.CONTINUE;
            }
        });
        return javaFiles;
    }

    private Map<String, Object> buildClassGraphData(org.xi.lt.flow.model.UmlClassDiagram classDiagram) {
        Map<String, Object> graphData = new HashMap<>();
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        for (org.xi.lt.flow.model.UmlClassDiagram.UmlClass clazz : classDiagram.getClasses()) {
            Map<String, Object> node = new HashMap<>();
            node.put("id", clazz.getClassName());
            node.put("name", clazz.getSimpleName());
            node.put("displayName", clazz.getSimpleName());
            node.put("type", "CLASS");
            nodes.add(node);
        }

        for (org.xi.lt.flow.model.UmlClassDiagram.UmlRelationship rel : classDiagram.getRelationships()) {
            Map<String, Object> edge = new HashMap<>();
            edge.put("source", rel.getSourceClassName());
            edge.put("target", rel.getTargetClassName());
            edge.put("type", rel.getType().name());
            edges.add(edge);
        }

        graphData.put("nodes", nodes);
        graphData.put("edges", edges);
        return graphData;
    }

    // ==================== Git 仓库 API ====================

    /**
     * 克隆 Git 仓库
     */
    @PostMapping("/git/clone")
    public GitResponse cloneGitRepository(@RequestBody GitCloneRequest request) {
        log.info("克隆 Git 仓库: {}", request.getRepoUrl());
        return gitRepositoryService.cloneRepository(
                request.getRepoUrl(),
                request.getLocalPath(),
                request.getUsername(),
                request.getPassword(),
                request.getBranch()
        );
    }

    /**
     * 获取仓库分支列表
     */
    @GetMapping("/git/branches")
    public Map<String, Object> getBranches(@RequestParam("repositoryPath") String repositoryPath) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> branches = gitRepositoryService.listBranchesByPath(repositoryPath);
            result.put("success", true);
            result.put("branches", branches);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 获取最近提交记录
     */
    @GetMapping("/git/commits")
    public Map<String, Object> getCommits(
            @RequestParam("repositoryPath") String repositoryPath,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<GitResponse.CommitInfo> commits = gitRepositoryService.listRecentCommitsByPath(repositoryPath, limit);
            result.put("success", true);
            result.put("commits", commits);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 切换分支或提交
     */
    @PostMapping("/git/checkout")
    public GitResponse checkoutByPath(@RequestBody GitCheckoutRequest request) {
        return gitRepositoryService.checkoutByPath(request.getRepositoryPath(), request.getRef());
    }

    // ==================== JAR 文件处理 API ====================

    /**
     * 上传并解析 JAR 文件
     */
    @PostMapping("/jar/parse")
    public Map<String, Object> parseJarFile(
            @RequestParam("jarFile") MultipartFile jarFile,
            @RequestParam(value = "includePackages", required = false) String includePackagesStr,
            @RequestParam(value = "excludePackages", required = false) String excludePackagesStr,
            @RequestParam(value = "flowType", required = false, defaultValue = "callChain") String flowType,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "theme", required = false, defaultValue = "DEFAULT") String themeName,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeCommonObject", required = false, defaultValue = "true") boolean excludeCommonObject,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "false") boolean excludeLt,
            @RequestParam(value = "excludeTestMethods", required = false, defaultValue = "true") boolean excludeTestMethods,
            @RequestParam(value = "excludeStaticMethods", required = false, defaultValue = "false") boolean excludeStaticMethods,
            @RequestParam(value = "excludePrivateMethods", required = false, defaultValue = "false") boolean excludePrivateMethods,
            @RequestParam(value = "excludeCollectionMethods", required = false, defaultValue = "false") boolean excludeCollectionMethods,
            @RequestParam(value = "excludeStringMethods", required = false, defaultValue = "false") boolean excludeStringMethods) {
        log.info("解析 JAR 文件: {}", jarFile.getOriginalFilename());
        Map<String, Object> result = new HashMap<>();

        try {
            // 保存并解析JAR
            JarFileService.JarInfo jarInfo = jarFileService.processJarFile(jarFile);

            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeCommonMethods(excludeCommonObject);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);
            filterConfig.setExcludeTestMethods(excludeTestMethods);
            filterConfig.setExcludeStaticMethods(excludeStaticMethods);
            filterConfig.setExcludePrivateMethods(excludePrivateMethods);
            filterConfig.setExcludeCollectionMethods(excludeCollectionMethods);
            filterConfig.setExcludeStringMethods(excludeStringMethods);

            File jarDir = jarFileService.getJarExtractedPath(jarInfo.getJarId());
            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent;
            String graphId = UUID.randomUUID().toString();

            if ("umlClass".equals(flowType)) {
                // 类图需要使用 UmlClassParser 逐个解析文件
                UmlClassParser classParser = new UmlClassParser(filterConfig);
                org.xi.lt.flow.model.UmlClassDiagram classDiagram =
                    new org.xi.lt.flow.model.UmlClassDiagram();
                classDiagram.setName(jarInfo.getOriginalFilename());

                // 收集所有 Java 文件
                List<File> javaFiles = collectJavaFiles(jarDir);
                for (File javaFile : javaFiles) {
                    try {
                        org.xi.lt.flow.model.UmlClassDiagram singleDiagram = classParser.parseFile(javaFile);
                        // 合并类图
                        for (org.xi.lt.flow.model.UmlClassDiagram.UmlClass clazz : singleDiagram.getClasses()) {
                            classDiagram.addClass(clazz);
                        }
                        for (org.xi.lt.flow.model.UmlClassDiagram.UmlRelationship rel : singleDiagram.getRelationships()) {
                            classDiagram.addRelationship(rel);
                        }
                    } catch (Exception e) {
                        log.warn("解析文件失败: {}", javaFile.getName(), e);
                    }
                }

                plantUmlContent = umlGenerator.generatePlantUml(classDiagram);
                result.put("nodeCount", classDiagram.getClasses().size());
                result.put("edgeCount", classDiagram.getRelationships().size());
                result.put("graphName", classDiagram.getName());
                result.put("graphData", buildClassGraphData(classDiagram));
            } else {
                // 调用链图或时序图
                ProjectParser projectParser = new ProjectParser(filterConfig);
                FlowGraph graph = projectParser.parseProjectFolder(jarDir);
                graphCache.put(graphId, graph);

                if ("sequence".equals(flowType)) {
                    org.xi.lt.flow.model.UmlSequenceDiagram sequenceDiagram = sequenceConverter.convert(graph);
                    plantUmlContent = sequenceGenerator.generatePlantUml(sequenceDiagram);
                    result.put("graphData", buildSequenceGraphData(sequenceDiagram));
                    result.put("nodeCount", sequenceDiagram.getParticipants().size());
                    result.put("edgeCount", sequenceDiagram.getMessages().size());
                } else {
                    PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                            PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
                    plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);
                    result.put("graphData", buildGraphData(graph));
                    result.put("nodeCount", graph.getNodeCount());
                    result.put("edgeCount", graph.getEdgeCount());
                }
                result.put("graphName", graph.getName());
            }

            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            result.put("success", true);
            result.put("message", "JAR 文件解析成功");
            result.put("graphId", graphId);
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("JAR 文件解析成功！");
        } catch (Exception e) {
            log.error("解析 JAR 文件失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }

    // ==================== 导出相关 API ====================

    /**
     * 导出流程图为指定格式
     */
    @PostMapping("/export/{format}")
    public ResponseEntity<byte[]> exportGraph(
            @PathVariable String format,
            @RequestBody Map<String, Object> request) {
        try {
            String plantUmlContent = (String) request.get("plantUmlContent");
            if (plantUmlContent == null || plantUmlContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ExportService.ExportFormat exportFormat;
            try {
                exportFormat = ExportService.ExportFormat.valueOf(format.toUpperCase());
            } catch (IllegalArgumentException e) {
                exportFormat = ExportService.ExportFormat.PNG;
            }

            byte[] content = exportService.renderToFormat(plantUmlContent, exportFormat);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(exportFormat.getMimeType()));
            headers.setContentDispositionFormData("attachment", "flow_diagram." + exportFormat.getExtension());

            return ResponseEntity.ok().headers(headers).body(content);

        } catch (Exception e) {
            log.error("导出失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 通过graphId导出
     */
    @GetMapping("/export/{format}/{graphId}")
    public ResponseEntity<byte[]> exportGraphById(
            @PathVariable String format,
            @PathVariable String graphId) {
        try {
            FlowGraph graph = graphCache.get(graphId);
            if (graph == null) {
                return ResponseEntity.notFound().build();
            }

            String plantUmlContent = generator.generatePlantUml(graph, PlantUmlCallChainGenerator.DiagramStyle.ACTIVITY);

            ExportService.ExportFormat exportFormat;
            try {
                exportFormat = ExportService.ExportFormat.valueOf(format.toUpperCase());
            } catch (IllegalArgumentException e) {
                exportFormat = ExportService.ExportFormat.PNG;
            }

            byte[] content = exportService.renderToFormat(plantUmlContent, exportFormat);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(exportFormat.getMimeType()));
            headers.setContentDispositionFormData("attachment", "flow_diagram." + exportFormat.getExtension());

            return ResponseEntity.ok().headers(headers).body(content);

        } catch (Exception e) {
            log.error("导出失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取所有导出格式
     */
    @GetMapping("/export/formats")
    public Map<String, Object> getExportFormats() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> formats = new ArrayList<>();

        for (ExportService.ExportFormat format : ExportService.ExportFormat.values()) {
            Map<String, String> formatInfo = new HashMap<>();
            formatInfo.put("name", format.name());
            formatInfo.put("extension", format.getExtension());
            formatInfo.put("mimeType", format.getMimeType());
            formats.add(formatInfo);
        }

        result.put("success", true);
        result.put("formats", formats);
        return result;
    }

    // ==================== 项目解析 API ====================

    /**
     * 上传并解析项目（支持ZIP/JAR/文件夹）
     */
    @PostMapping("/project/upload")
    public Map<String, Object> uploadAndParseProject(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "theme", required = false, defaultValue = "default") String themeName,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeConstructors", required = false, defaultValue = "true") boolean excludeConstructors,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt) {
        log.info("收到项目上传请求: {}", file.getOriginalFilename());

        Map<String, Object> result = new HashMap<>();

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path savedFilePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), savedFilePath);

            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            ProjectParser projectParser = new ProjectParser(filterConfig);
            FlowGraph graph = projectParser.parseFileOrFolder(savedFilePath.toFile());

            String graphId = UUID.randomUUID().toString();
            graphCache.put(graphId, graph);

            ChartTheme theme = ChartTheme.getTheme(themeName);
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                    PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);

            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            result.put("success", true);
            result.put("message", "项目解析成功");
            result.put("graphId", graphId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("graphName", graph.getName());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            Files.deleteIfExists(savedFilePath);

            log.info("项目解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("项目解析失败", e);
            result.put("success", false);
            result.put("message", "项目解析失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 保存图到缓存（用于后续对比）
     */
    @PostMapping("/graph/save")
    public Map<String, Object> saveGraphToCache(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();
        try {
            String graphId = request.get("graphId") != null ? (String) request.get("graphId") : UUID.randomUUID().toString();
            String name = request.get("name") != null ? (String) request.get("name") : "graph_" + graphId;

            // 重建 FlowGraph
            FlowGraph graph = FlowGraph.builder().name(name).build();

            result.put("success", true);
            result.put("graphId", graphId);
            result.put("message", "图已保存（注意：完整图重建需要更详细的信息）");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 解析 Git 仓库路径（通过路径，而非repoId）
     */
    @PostMapping("/git/parse")
    public Map<String, Object> parseGitRepositoryByPath(
            @RequestParam("repositoryPath") String repositoryPath,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style,
            @RequestParam(value = "theme", required = false, defaultValue = "DEFAULT") String themeName,
            @RequestParam(value = "excludeJdk", required = false, defaultValue = "true") boolean excludeJdk,
            @RequestParam(value = "excludeLogging", required = false, defaultValue = "true") boolean excludeLogging,
            @RequestParam(value = "excludeGetterSetter", required = false, defaultValue = "true") boolean excludeGetterSetter,
            @RequestParam(value = "excludeConstructors", required = false, defaultValue = "true") boolean excludeConstructors,
            @RequestParam(value = "excludeBuilderMethods", required = false, defaultValue = "true") boolean excludeBuilderMethods,
            @RequestParam(value = "excludeLombokMethods", required = false, defaultValue = "true") boolean excludeLombokMethods,
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt) {
        log.info("解析 Git 仓库: {}", repositoryPath);

        Map<String, Object> result = new HashMap<>();

        try {
            File repoDir = new File(repositoryPath);
            if (!repoDir.exists()) {
                result.put("success", false);
                result.put("message", "仓库不存在: " + repositoryPath);
                return result;
            }

            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            ProjectParser projectParser = new ProjectParser(filterConfig);
            FlowGraph graph = projectParser.parseProjectFolder(repoDir);

            String graphId = UUID.randomUUID().toString();
            graphCache.put(graphId, graph);

            ChartTheme theme = ChartTheme.getTheme(themeName);
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                    PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);

            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            result.put("success", true);
            result.put("message", "仓库解析成功");
            result.put("graphId", graphId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("graphName", graph.getName());
            result.put("dotContent", plantUmlContent);
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("Git 仓库解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());

        } catch (Exception e) {
            log.error("Git 仓库解析失败", e);
            result.put("success", false);
            result.put("message", "Git 仓库解析失败: " + e.getMessage());
        }

        return result;
    }

    // ==================== 差异分析 API ====================

    /**
     * 对比两个流程图
     */
    @PostMapping("/diff/compare")
    public DiffResultResponse compareGraphs(@RequestBody DiffRequest request) {
        String oldGraphId = request.getOldGraphId() != null ? request.getOldGraphId() : request.getOldSourceId();
        String newGraphId = request.getNewGraphId() != null ? request.getNewGraphId() : request.getNewSourceId();

        log.info("对比流程图: {} vs {}", oldGraphId, newGraphId);

        FlowGraph oldGraph = graphCache.get(oldGraphId);
        FlowGraph newGraph = graphCache.get(newGraphId);

        if (oldGraph == null || newGraph == null) {
            return DiffResultResponse.error("找不到图，请确保先解析并保存图");
        }

        FlowGraphDiffService.DiffResult diffResult = diffService.compare(oldGraph, newGraph);
        DiffResultResponse response = diffResult.toResponse();
        response.setOldGraphId(oldGraphId);
        response.setNewGraphId(newGraphId);

        // 生成高亮对比图
        FlowGraph highlightedGraph = diffService.generateHighlightedDiffGraph(diffResult);
        String plantUmlContent = generator.generatePlantUml(highlightedGraph,
                PlantUmlCallChainGenerator.DiagramStyle.ACTIVITY, ChartTheme.defaultTheme());
        response.setHighlightedPlantUmlContent(plantUmlContent);

        try {
            String base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            response.setHighlightedPreviewImage(base64Image);
        } catch (Exception e) {
            log.warn("高亮图渲染失败", e);
        }

        return response;
    }

    /**
     * 对比同一仓库的两个版本
     */
    @PostMapping("/diff/git/{repoId}")
    public Map<String, Object> compareGitVersions(
            @PathVariable String repoId,
            @RequestBody Map<String, String> request) {
        log.info("对比 Git 仓库版本: {} vs {}", request.get("oldRef"), request.get("newRef"));

        Map<String, Object> result = new HashMap<>();

        try {
            String oldRef = request.get("oldRef");
            String newRef = request.get("newRef");
            String themeName = request.getOrDefault("theme", "default");

            // 切换到旧版本并解析
            gitRepositoryService.checkout(repoId, oldRef);
            File repoDir = gitRepositoryService.getRepositoryPath(repoId);
            ProjectParser projectParser = new ProjectParser(StaticFilterConfig.defaultConfig());
            FlowGraph oldGraph = projectParser.parseProjectFolder(repoDir);
            String oldGraphId = UUID.randomUUID().toString();
            graphCache.put(oldGraphId, oldGraph);

            // 切换到新版本并解析
            gitRepositoryService.checkout(repoId, newRef);
            repoDir = gitRepositoryService.getRepositoryPath(repoId);
            FlowGraph newGraph = projectParser.parseProjectFolder(repoDir);
            String newGraphId = UUID.randomUUID().toString();
            graphCache.put(newGraphId, newGraph);

            // 对比
            FlowGraphDiffService.DiffResult diffResult = diffService.compare(oldGraph, newGraph);
            DiffResultResponse response = diffResult.toResponse();
            response.setOldGraphId(oldGraphId);
            response.setNewGraphId(newGraphId);

            // 生成高亮对比图
            FlowGraph highlightedGraph = diffService.generateHighlightedDiffGraph(diffResult);
            ChartTheme theme = ChartTheme.getTheme(themeName);
            String plantUmlContent = generator.generatePlantUml(highlightedGraph,
                    PlantUmlCallChainGenerator.DiagramStyle.ACTIVITY, theme);
            response.setHighlightedPlantUmlContent(plantUmlContent);

            try {
                String base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
                response.setHighlightedPreviewImage(base64Image);
            } catch (Exception e) {
                log.warn("高亮图渲染失败", e);
            }

            result.put("success", true);
            result.put("diff", response);

        } catch (Exception e) {
            log.error("Git 版本对比失败", e);
            result.put("success", false);
            result.put("message", "Git 版本对比失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 清除图缓存
     */
    @DeleteMapping("/graph/cache")
    public Map<String, Object> clearGraphCache() {
        Map<String, Object> result = new HashMap<>();
        int size = graphCache.size();
        graphCache.clear();
        result.put("success", true);
        result.put("message", "已清除 " + size + " 个图");
        return result;
    }

    // ==================== JAR 文件处理 API ====================

    /**
     * 上传并处理 JAR 文件
     */
    @PostMapping("/jar/upload")
    public Map<String, Object> uploadJar(@RequestParam("file") MultipartFile file) {
        log.info("收到 JAR 文件: {}", file.getOriginalFilename());
        Map<String, Object> result = new HashMap<>();

        try {
            JarFileService.JarInfo jarInfo = jarFileService.processJarFile(file);
            result.put("success", true);
            result.put("jarInfo", jarInfo);
            result.put("message", "JAR 文件处理成功，找到 " + jarInfo.getJavaSourceCount() + " 个 Java 源文件，" + jarInfo.getClassFileCount() + " 个 class 文件");
        } catch (Exception e) {
            log.error("处理 JAR 文件失败", e);
            result.put("success", false);
            result.put("message", "JAR 文件处理失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 读取 JAR 中的 Java 源码文件内容
     */
    @GetMapping("/jar/{jarId}/source")
    public Map<String, Object> readJarSource(
            @PathVariable String jarId,
            @RequestParam("path") String entryPath) {
        Map<String, Object> result = new HashMap<>();

        try {
            String content = jarFileService.readJavaSource(jarId, entryPath);
            result.put("success", true);
            result.put("path", entryPath);
            result.put("content", content);
        } catch (Exception e) {
            log.error("读取 JAR 源码失败", e);
            result.put("success", false);
            result.put("message", "读取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取 JAR 中的所有 Java 源码
     */
    @GetMapping("/jar/{jarId}/sources")
    public Map<String, Object> getAllJarSources(@PathVariable String jarId) {
        Map<String, Object> result = new HashMap<>();

        try {
            List<JarFileService.JavaFileContent> sources = jarFileService.getAllJavaSources(jarId);
            result.put("success", true);
            result.put("sources", sources);
            result.put("count", sources.size());
        } catch (Exception e) {
            log.error("获取 JAR 源码列表失败", e);
            result.put("success", false);
            result.put("message", "获取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 删除 JAR 文件及解压内容
     */
    @DeleteMapping("/jar/{jarId}")
    public Map<String, Object> deleteJar(@PathVariable String jarId) {
        Map<String, Object> result = new HashMap<>();

        try {
            jarFileService.deleteJar(jarId);
            result.put("success", true);
            result.put("message", "JAR 文件已删除: " + jarId);
        } catch (Exception e) {
            log.error("删除 JAR 文件失败", e);
            result.put("success", false);
            result.put("message", "删除失败: " + e.getMessage());
        }

        return result;
    }

    // ==================== 本地源码服务 API ====================

    /**
     * 获取工作目录下的项目列表
     */
    @GetMapping("/local/projects")
    public Map<String, Object> listLocalProjects() {
        Map<String, Object> result = new HashMap<>();

        try {
            List<LocalSourceService.ProjectInfo> projects = localSourceService.listProjects();
            result.put("success", true);
            result.put("projects", projects);
            result.put("count", projects.size());
        } catch (Exception e) {
            log.error("获取本地项目列表失败", e);
            result.put("success", false);
            result.put("message", "获取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取项目的目录结构
     */
    @GetMapping("/local/project/structure")
    public Map<String, Object> getProjectStructure(
            @RequestParam("path") String projectPath,
            @RequestParam(value = "depth", required = false, defaultValue = "5") int maxDepth) {
        Map<String, Object> result = new HashMap<>();

        try {
            LocalSourceService.DirectoryNode structure = localSourceService.getProjectStructure(projectPath, maxDepth);
            result.put("success", true);
            result.put("structure", structure);
        } catch (Exception e) {
            log.error("获取项目结构失败", e);
            result.put("success", false);
            result.put("message", "获取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 导入项目源码
     */
    @PostMapping("/local/project/import")
    public Map<String, Object> importLocalProject(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();

        try {
            String projectPath = (String) request.get("path");
            @SuppressWarnings("unchecked")
            List<String> includePatterns = (List<String>) request.get("includePatterns");
            @SuppressWarnings("unchecked")
            List<String> excludePatterns = (List<String>) request.get("excludePatterns");

            LocalSourceService.SourceImportResult importResult = localSourceService.importProject(
                    projectPath, includePatterns, excludePatterns);

            result.put("success", true);
            result.put("importResult", importResult);
            result.put("message", "成功导入 " + importResult.getFileCount() + " 个文件");
        } catch (Exception e) {
            log.error("导入项目失败", e);
            result.put("success", false);
            result.put("message", "导入失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 读取源码文件内容
     */
    @GetMapping("/local/source/{importId}")
    public Map<String, Object> readLocalSource(
            @PathVariable String importId,
            @RequestParam("path") String relativePath) {
        Map<String, Object> result = new HashMap<>();

        try {
            String content = localSourceService.readSourceFile(importId, relativePath);
            result.put("success", true);
            result.put("path", relativePath);
            result.put("content", content);
        } catch (Exception e) {
            log.error("读取源码失败", e);
            result.put("success", false);
            result.put("message", "读取失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 删除导入的源码
     */
    @DeleteMapping("/local/source/{importId}")
    public Map<String, Object> deleteLocalImport(@PathVariable String importId) {
        Map<String, Object> result = new HashMap<>();

        try {
            localSourceService.deleteImport(importId);
            result.put("success", true);
            result.put("message", "已删除导入的源码: " + importId);
        } catch (Exception e) {
            log.error("删除导入失败", e);
            result.put("success", false);
            result.put("message", "删除失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 解析本地项目生成流程图
     */
    @PostMapping("/local/project/parse")
    public Map<String, Object> parseLocalProject(@RequestBody Map<String, Object> request) {
        log.info("解析本地项目");
        Map<String, Object> result = new HashMap<>();

        try {
            String projectPath = (String) request.get("path");
            String style = (String) request.getOrDefault("style", "ACTIVITY");
            String themeName = (String) request.getOrDefault("theme", "default");
            Boolean excludeJdk = (Boolean) request.getOrDefault("excludeJdk", true);
            Boolean excludeLogging = (Boolean) request.getOrDefault("excludeLogging", true);
            Boolean excludeGetterSetter = (Boolean) request.getOrDefault("excludeGetterSetter", true);
            Boolean excludeConstructors = (Boolean) request.getOrDefault("excludeConstructors", true);
            Boolean excludeBuilderMethods = (Boolean) request.getOrDefault("excludeBuilderMethods", true);
            Boolean excludeLombokMethods = (Boolean) request.getOrDefault("excludeLombokMethods", true);
            Boolean excludeLt = (Boolean) request.getOrDefault("excludeLt", true);

            // 构建过滤配置
            StaticFilterConfig filterConfig = StaticFilterConfig.defaultConfig();
            filterConfig.setExcludeJdk(excludeJdk);
            filterConfig.setExcludeLogging(excludeLogging);
            filterConfig.setExcludeGetterSetter(excludeGetterSetter);
            filterConfig.setExcludeConstructors(excludeConstructors);
            filterConfig.setExcludeBuilderMethods(excludeBuilderMethods);
            filterConfig.setExcludeLombokMethods(excludeLombokMethods);
            filterConfig.setExcludeLt(excludeLt);

            ProjectParser projectParser = new ProjectParser(filterConfig);
            FlowGraph graph = projectParser.parseProjectFolder(new File(projectPath));

            String graphId = UUID.randomUUID().toString();
            graphCache.put(graphId, graph);

            ChartTheme theme = ChartTheme.getTheme(themeName);
            PlantUmlCallChainGenerator.DiagramStyle diagramStyle =
                    PlantUmlCallChainGenerator.DiagramStyle.valueOf(style.toUpperCase());
            String plantUmlContent = generator.generatePlantUml(graph, diagramStyle, theme);

            String base64Image = null;
            try {
                base64Image = plantUmlService.renderToBase64Png(plantUmlContent);
            } catch (Exception e) {
                log.warn("图片渲染失败，仅返回PlantUML源码", e);
            }

            result.put("success", true);
            result.put("message", "项目解析成功");
            result.put("graphId", graphId);
            result.put("nodeCount", graph.getNodeCount());
            result.put("edgeCount", graph.getEdgeCount());
            result.put("graphName", graph.getName());
            result.put("plantUmlContent", plantUmlContent);
            result.put("graphData", buildGraphData(graph));
            if (base64Image != null) {
                result.put("previewImage", base64Image);
            }

            log.info("本地项目解析成功！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());
        } catch (Exception e) {
            log.error("解析本地项目失败", e);
            result.put("success", false);
            result.put("message", "解析失败: " + e.getMessage());
        }

        return result;
    }
}
