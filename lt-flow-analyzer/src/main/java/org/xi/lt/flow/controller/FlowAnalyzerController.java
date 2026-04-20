package org.xi.lt.flow.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.xi.lt.flow.generator.PlantUmlCallChainGenerator;
import org.xi.lt.flow.generator.PlantUmlClassDiagramGenerator;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.UmlClassDiagram;
import org.xi.lt.flow.parser.JavaCodeParser;
import org.xi.lt.flow.parser.UmlClassParser;
import org.xi.lt.flow.service.PlantUmlService;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
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

    private final JavaCodeParser parser = new JavaCodeParser();
    private final PlantUmlCallChainGenerator generator = new PlantUmlCallChainGenerator();

    private final UmlClassParser umlParser = new UmlClassParser();
    private final PlantUmlClassDiagramGenerator umlGenerator = new PlantUmlClassDiagramGenerator();
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("service", "Flow Analyzer");
        result.put("version", "1.0.0");
        return result;
    }
    
    /**
     * 上传并解析单个Java文件
     */
    @PostMapping("/upload/file")
    public Map<String, Object> uploadAndParseFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", required = false, defaultValue = "ACTIVITY") String style) {
        log.info("收到文件上传请求: {}, 样式: {}", file.getOriginalFilename(), style);

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
    public Map<String, Object> parseCode(@RequestBody Map<String, String> request) {
        log.info("收到代码解析请求");

        Map<String, Object> result = new HashMap<>();

        try {
            String code = request.get("code");
            String style = request.getOrDefault("style", "ACTIVITY");
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
}
