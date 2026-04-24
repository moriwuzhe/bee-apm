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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Python 代码索引器 - 把代码库解析成知识图谱
 */
public class PythonCodeIndexer implements CodeIndexer {

    @Override
    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        System.out.println("PythonCodeIndexer: 开始索引代码库: " + repoPath);
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 遍历目录，找到所有 Python 文件
        System.out.println("PythonCodeIndexer: 开始遍历目录");
        try {
            File repoDir = new File(repoPath);
            List<File> pythonFiles = findPythonFiles(repoDir);
            System.out.println("PythonCodeIndexer: 找到 " + pythonFiles.size() + " 个 Python 文件");

            // 索引所有 Python 文件
            System.out.println("PythonCodeIndexer: 开始索引文件");
            for (File file : pythonFiles) {
                try {
                    indexFile(graph, file);
                } catch (Exception e) {
                    System.out.println("PythonCodeIndexer: 索引文件失败: " + file.getAbsolutePath());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            System.out.println("PythonCodeIndexer: 遍历目录失败: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("PythonCodeIndexer: 索引完成，节点数: " + graph.getNodes().size() + "，边数: " + graph.getEdges().size());
        return graph;
    }

    // 递归查找所有 Python 文件
    private List<File> findPythonFiles(File directory) {
        List<File> pythonFiles = new ArrayList<>();
        if (!directory.exists() || !directory.isDirectory()) {
            return pythonFiles;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return pythonFiles;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                pythonFiles.addAll(findPythonFiles(file));
            } else if (file.getName().endsWith(".py")) {
                pythonFiles.add(file);
            }
        }

        return pythonFiles;
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
        String content = new String(Files.readAllBytes(file.toPath()));

        // 解析类定义
        Pattern classPattern = Pattern.compile("class \\s+([a-zA-Z0-9_]+)\\s*\\(([^)]*)\\)\\s*:");
        Matcher classMatcher = classPattern.matcher(content);
        while (classMatcher.find()) {
            String className = classMatcher.group(1);
            String superClasses = classMatcher.group(2);

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

            // 处理继承关系
            if (!superClasses.trim().isEmpty()) {
                String[] superClassList = superClasses.split(",");
                for (String superClass : superClassList) {
                    final String trimmedSuperClass = superClass.trim();
                    // 简单处理，查找同名类
                    GraphNode superNode = graph.getNodes().values().stream()
                            .filter(n -> n.getType() != null && "CLASS".equals(n.getType()) && n.getName() != null && trimmedSuperClass.equals(n.getName()))
                            .findFirst()
                            .orElse(null);
                    if (superNode != null) {
                        graph.addEdge(GraphEdge.builder()
                                .id(UUID.randomUUID().toString())
                                .sourceId(classId)
                                .targetId(superNode.getId())
                                .type("EXTENDS")
                                .build());
                    }
                }
            }
        }

        // 解析函数定义
        Pattern functionPattern = Pattern.compile("def \\s+([a-zA-Z0-9_]+)\\s*\\(([^)]*)\\)\\s*:");
        Matcher functionMatcher = functionPattern.matcher(content);
        while (functionMatcher.find()) {
            String functionName = functionMatcher.group(1);

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
        Pattern importPattern = Pattern.compile("import \\s+([a-zA-Z0-9_.]+)");
        Matcher importMatcher = importPattern.matcher(content);
        while (importMatcher.find()) {
            String importedModule = importMatcher.group(1);
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

    @Override
    public String[] getSupportedLanguages() {
        return new String[]{"python"};
    }
}