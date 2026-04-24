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
 * TypeScript 代码索引器 - 把代码库解析成知识图谱
 */
public class TypeScriptCodeIndexer implements CodeIndexer {

    @Override
    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        System.out.println("TypeScriptCodeIndexer: 开始索引代码库: " + repoPath);
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 遍历目录，找到所有 TypeScript 文件
        System.out.println("TypeScriptCodeIndexer: 开始遍历目录");
        try {
            File repoDir = new File(repoPath);
            List<File> tsFiles = findTypeScriptFiles(repoDir);
            System.out.println("TypeScriptCodeIndexer: 找到 " + tsFiles.size() + " 个 TypeScript 文件");

            // 索引所有 TypeScript 文件
            System.out.println("TypeScriptCodeIndexer: 开始索引文件");
            for (File file : tsFiles) {
                try {
                    indexFile(graph, file);
                } catch (Exception e) {
                    System.out.println("TypeScriptCodeIndexer: 索引文件失败: " + file.getAbsolutePath());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            System.out.println("TypeScriptCodeIndexer: 遍历目录失败: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("TypeScriptCodeIndexer: 索引完成，节点数: " + graph.getNodes().size() + "，边数: " + graph.getEdges().size());
        return graph;
    }

    // 递归查找所有 TypeScript 文件
    private List<File> findTypeScriptFiles(File directory) {
        List<File> tsFiles = new ArrayList<>();
        if (!directory.exists() || !directory.isDirectory()) {
            return tsFiles;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return tsFiles;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                tsFiles.addAll(findTypeScriptFiles(file));
            } else if (file.getName().endsWith(".ts") || file.getName().endsWith(".tsx")) {
                tsFiles.add(file);
            }
        }

        return tsFiles;
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

        for (String line : lines) {
            line = line.trim();

            // 解析类定义
            if (line.startsWith("class ")) {
                String className = line.substring(6).trim();
                if (className.contains(" extends ")) {
                    className = className.substring(0, className.indexOf(" extends ")).trim();
                } else if (className.contains(" implements ")) {
                    className = className.substring(0, className.indexOf(" implements ")).trim();
                } else if (className.contains(" {") || className.contains("{") ) {
                    className = className.substring(0, className.indexOf(" {")).trim();
                    if (className.isEmpty()) {
                        className = line.substring(6, line.indexOf("{")).trim();
                    }
                }

                String classId = UUID.randomUUID().toString();
                GraphNode classNode = GraphNode.builder()
                        .id(classId)
                        .type("CLASS")
                        .name(className)
                        .qualifiedName(file.getName() + "." + className)
                        .filePath(file.getAbsolutePath())
                        .parentId(fileId)
                        .build();
                graph.addNode(classNode);

                // 类包含在文件中
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(classId)
                        .type("CONTAINS")
                        .build());
            }

            // 解析接口定义
            if (line.startsWith("interface ")) {
                String interfaceName = line.substring(10).trim();
                if (interfaceName.contains(" extends ")) {
                    interfaceName = interfaceName.substring(0, interfaceName.indexOf(" extends ")).trim();
                } else if (interfaceName.contains(" {") || interfaceName.contains("{") ) {
                    interfaceName = interfaceName.substring(0, interfaceName.indexOf(" {")).trim();
                    if (interfaceName.isEmpty()) {
                        interfaceName = line.substring(10, line.indexOf("{")).trim();
                    }
                }

                String interfaceId = UUID.randomUUID().toString();
                GraphNode interfaceNode = GraphNode.builder()
                        .id(interfaceId)
                        .type("INTERFACE")
                        .name(interfaceName)
                        .qualifiedName(file.getName() + "." + interfaceName)
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
            if (line.startsWith("function ")) {
                String functionName = line.substring(9).trim();
                if (functionName.contains("(")) {
                    functionName = functionName.substring(0, functionName.indexOf("(")).trim();
                }

                String functionId = UUID.randomUUID().toString();
                GraphNode functionNode = GraphNode.builder()
                        .id(functionId)
                        .type("METHOD")
                        .name(functionName)
                        .qualifiedName(file.getName() + "#" + functionName)
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
            if (line.startsWith("import ") && line.contains(" from ")) {
                int start = line.indexOf(" from ") + 6;
                if (line.substring(start).contains("'")) {
                    int quoteStart = line.indexOf("'", start);
                    int quoteEnd = line.lastIndexOf("'");
                    if (quoteStart != -1 && quoteEnd > quoteStart) {
                        String importedModule = line.substring(quoteStart + 1, quoteEnd).trim();
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
                } else if (line.substring(start).contains("\"")) {
                    int quoteStart = line.indexOf("\"", start);
                    int quoteEnd = line.lastIndexOf("\"");
                    if (quoteStart != -1 && quoteEnd > quoteStart) {
                        String importedModule = line.substring(quoteStart + 1, quoteEnd).trim();
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
        return new String[]{"typescript", "ts", "tsx"};
    }
}