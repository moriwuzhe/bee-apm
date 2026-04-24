package org.xi.lt.code.parser;

import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Go 代码索引器 - 把代码库解析成知识图谱
 */
public class GoCodeIndexer implements CodeIndexer {

    @Override
    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        System.out.println("GoCodeIndexer: 开始索引代码库: " + repoPath);
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 遍历目录，找到所有 Go 文件
        System.out.println("GoCodeIndexer: 开始遍历目录");
        try {
            File repoDir = new File(repoPath);
            List<File> goFiles = findGoFiles(repoDir);
            System.out.println("GoCodeIndexer: 找到 " + goFiles.size() + " 个 Go 文件");

            // 索引所有 Go 文件
            System.out.println("GoCodeIndexer: 开始索引文件");
            for (File file : goFiles) {
                try {
                    indexFile(graph, file);
                } catch (Exception e) {
                    System.out.println("GoCodeIndexer: 索引文件失败: " + file.getAbsolutePath());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            System.out.println("GoCodeIndexer: 遍历目录失败: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("GoCodeIndexer: 索引完成，节点数: " + graph.getNodes().size() + "，边数: " + graph.getEdges().size());
        return graph;
    }

    // 递归查找所有 Go 文件
    private List<File> findGoFiles(File directory) {
        List<File> goFiles = new ArrayList<>();
        if (!directory.exists() || !directory.isDirectory()) {
            return goFiles;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return goFiles;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                goFiles.addAll(findGoFiles(file));
            } else if (file.getName().endsWith(".go")) {
                goFiles.add(file);
            }
        }

        return goFiles;
    }

    private void indexFile(KnowledgeGraph graph, File file) throws IOException {
        String fileId = UUID.randomUUID().toString();

        // 创建文件节点
        GraphNode fileNode = GraphNode.builder()
                .id(fileId)
                .type("FILE")
                .name(file.getName())
                .filePath(file.getAbsolutePath())
                .build();
        graph.addNode(fileNode);

        // 读取文件内容
        List<String> lines = Files.readAllLines(file.toPath());
        String packageName = "";

        for (String line : lines) {
            line = line.trim();

            // 解析包声明
            if (line.startsWith("package ")) {
                packageName = line.substring(8).trim();
            }

            // 解析类型定义（结构体）
            if (line.startsWith("type ") && line.contains(" struct")) {
                String structName = line.substring(5, line.indexOf(" struct")).trim();
                String structId = UUID.randomUUID().toString();
                GraphNode structNode = GraphNode.builder()
                        .id(structId)
                        .type("CLASS")
                        .name(structName)
                        .qualifiedName(packageName + "." + structName)
                        .filePath(file.getAbsolutePath())
                        .parentId(fileId)
                        .build();
                graph.addNode(structNode);

                // 结构体包含在文件中
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(structId)
                        .type("CONTAINS")
                        .build());
            }

            // 解析接口定义
            if (line.startsWith("type ") && line.contains(" interface")) {
                String interfaceName = line.substring(5, line.indexOf(" interface")).trim();
                String interfaceId = UUID.randomUUID().toString();
                GraphNode interfaceNode = GraphNode.builder()
                        .id(interfaceId)
                        .type("INTERFACE")
                        .name(interfaceName)
                        .qualifiedName(packageName + "." + interfaceName)
                        .filePath(file.getAbsolutePath())
                        .parentId(fileId)
                        .build();
                graph.addNode(interfaceNode);

                // 接口包含在文件中
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(interfaceId)
                        .type("CONTAINS")
                        .build());
            }

            // 解析函数定义
            if (line.startsWith("func ")) {
                // 简单处理，提取函数名
                String functionName = line.substring(5).trim();
                if (functionName.startsWith("(")) {
                    // 方法定义，跳过括号部分
                    int endOfParams = functionName.indexOf(")");
                    if (endOfParams != -1) {
                        functionName = functionName.substring(endOfParams + 1).trim();
                    }
                }
                // 提取函数名
                int startOfParams = functionName.indexOf("(");
                if (startOfParams != -1) {
                    functionName = functionName.substring(0, startOfParams).trim();
                }

                String functionId = UUID.randomUUID().toString();
                GraphNode functionNode = GraphNode.builder()
                        .id(functionId)
                        .type("METHOD")
                        .name(functionName)
                        .qualifiedName(packageName + "#" + functionName)
                        .filePath(file.getAbsolutePath())
                        .parentId(fileId)
                        .build();
                graph.addNode(functionNode);

                // 函数包含在文件中
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(functionId)
                        .type("CONTAINS")
                        .build());
            }

            // 解析导入关系
            if (line.startsWith("import ")) {
                // 简单处理，提取导入模块
                if (line.contains("\"")) {
                    int start = line.indexOf("\"");
                    int end = line.lastIndexOf("\"");
                    if (start != -1 && end > start) {
                        String importedModule = line.substring(start + 1, end).trim();
                        // 简单处理，创建导入节点
                        String importId = UUID.randomUUID().toString();
                        GraphNode importNode = GraphNode.builder()
                                .id(importId)
                                .type("MODULE")
                                .name(importedModule)
                                .qualifiedName(importedModule)
                                .build();
                        graph.addNode(importNode);

                        // 导入关系
                        graph.addEdge(GraphEdge.builder()
                                .id(UUID.randomUUID().toString())
                                .sourceId(fileId)
                                .targetId(importId)
                                .type("IMPORTS")
                                .build());
                    }
                }
            }
        }
    }

    @Override
    public String[] getSupportedLanguages() {
        return new String[]{"go"};
    }
}