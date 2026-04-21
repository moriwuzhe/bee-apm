package org.xi.lt.flow.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.xi.lt.flow.generator.FlowToSequenceDiagramConverter;
import org.xi.lt.flow.generator.PlantUmlCallChainGenerator;
import org.xi.lt.flow.generator.PlantUmlClassDiagramGenerator;
import org.xi.lt.flow.generator.UmlSequenceDiagramGenerator;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.UmlClassDiagram;
import org.xi.lt.flow.model.UmlSequenceDiagram;
import org.xi.lt.flow.parser.JavaCodeParser;
import org.xi.lt.flow.parser.UmlClassParser;
import org.xi.lt.flow.service.PlantUmlService;
import org.xi.lt.flow.dynamic.InMemorySpanStore;
import org.xi.lt.flow.dynamic.SpanToFlowGraphConverter;
import org.xi.lt.flow.staticfilter.StaticFilterConfig;
import org.xi.lt.flow.staticmodel.MethodEntry;
import org.xi.lt.flow.staticparser.EnhancedJavaCodeParser;
import org.xi.lt.server.domain.model.span.SpanView;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    private final JavaCodeParser parser = new JavaCodeParser();
    private final EnhancedJavaCodeParser enhancedParser = new EnhancedJavaCodeParser();
    private final PlantUmlCallChainGenerator generator = new PlantUmlCallChainGenerator();

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
            @RequestParam(value = "excludeLt", required = false, defaultValue = "true") boolean excludeLt) {
        log.info("收到增强版文件上传请求: {}, 入口: {}, 深度: {}",
                file.getOriginalFilename(), entryMethodId, maxDepth);

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

            // 使用增强解析器
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFileFromEntry(savedFilePath.toFile(), entryMethodId);

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

            // 使用增强解析器
            EnhancedJavaCodeParser parserWithConfig = new EnhancedJavaCodeParser(filterConfig);
            FlowGraph graph = parserWithConfig.parseFileFromEntry(tempFile.toFile(), entryMethodId);

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
    public Map<String, Object> uploadAndGenerateUmlClassDiagram(@RequestParam("file") MultipartFile file) {
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

            // 解析文件，生成 UML 类图
            UmlClassDiagram diagram = umlParser.parseFile(savedFilePath.toFile());

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
    public Map<String, Object> parseCodeAndGenerateUml(@RequestBody Map<String, String> request) {
        log.info("收到 UML 类图代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = request.get("code");
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

            // 解析文件，生成 UML 类图
            UmlClassDiagram diagram = umlParser.parseFile(tempFile.toFile());

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
    public Map<String, Object> uploadAndGenerateSequenceDiagram(@RequestParam("file") MultipartFile file) {
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

            // 解析文件，生成调用链 FlowGraph
            FlowGraph graph = parser.parseFile(savedFilePath.toFile());

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
    public Map<String, Object> parseCodeAndGenerateSequence(@RequestBody Map<String, String> request) {
        log.info("收到 UML 时序图代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = request.get("code");
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

            // 解析文件，生成调用链 FlowGraph
            FlowGraph graph = parser.parseFile(tempFile.toFile());

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

        // 构建节点列表
        List<Map<String, Object>> nodeList = new ArrayList<>();
        for (org.xi.lt.flow.model.FlowNode node : graph.getAllNodes()) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", node.getId());
            nodeData.put("type", node.getType() != null ? node.getType().name() : "UNKNOWN");
            nodeData.put("className", node.getClassName());
            nodeData.put("methodName", node.getMethodName());
            nodeData.put("displayName", node.getDisplayName());
            nodeData.put("methodSignature", node.getMethodSignature());
            nodeData.put("metadata", node.getMetadata());
            nodeList.add(nodeData);
        }
        data.put("nodes", nodeList);

        // 构建边列表
        List<Map<String, Object>> edgeList = new ArrayList<>();
        for (org.xi.lt.flow.model.FlowEdge edge : graph.getEdges()) {
            Map<String, Object> edgeData = new HashMap<>();
            String sourceId = edge.getSource() != null ? edge.getSource().getId() : null;
            String targetId = edge.getTarget() != null ? edge.getTarget().getId() : null;
            edgeData.put("sourceId", sourceId);
            edgeData.put("targetId", targetId);
            edgeData.put("source", sourceId);  // ECharts 需要 source
            edgeData.put("target", targetId);  // ECharts 需要 target
            edgeData.put("callType", edge.getCallType() != null ? edge.getCallType().name() : null);
            edgeData.put("callCount", edge.getCallCount());
            edgeList.add(edgeData);
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
}
