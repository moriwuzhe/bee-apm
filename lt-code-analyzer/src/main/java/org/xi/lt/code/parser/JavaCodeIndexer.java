package org.xi.lt.code.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Java 代码索引器 - 把代码库解析成知识图谱
 */
public class JavaCodeIndexer implements CodeIndexer {

    private final JavaParser javaParser = new JavaParser();

    // 临时存储：类名 -> 类节点 ID
    private Map<String, String> classNameToId = new HashMap<>();

    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        System.out.println("JavaCodeIndexer: 开始索引代码库: " + repoPath);
        classNameToId.clear();
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 遍历目录，找到所有 Java 文件
        System.out.println("JavaCodeIndexer: 开始遍历目录");
        try {
            File repoDir = new File(repoPath);
            List<File> javaFiles = findJavaFiles(repoDir);
            System.out.println("JavaCodeIndexer: 找到 " + javaFiles.size() + " 个 Java 文件");

            // 第一遍：先索引所有类和文件，构建 classNameToId
            System.out.println("JavaCodeIndexer: 开始第一遍索引");
            for (File file : javaFiles) {
                try {
                    indexFileFirstPass(graph, file);
                } catch (Exception e) {
                    System.out.println("JavaCodeIndexer: 索引文件失败 (第一遍): " + file.getAbsolutePath());
                    e.printStackTrace();
                }
            }

            // 第二遍：索引方法、字段、调用关系、导入关系
            System.out.println("JavaCodeIndexer: 开始第二遍索引");
            for (File file : javaFiles) {
                try {
                    indexFileSecondPass(graph, file);
                } catch (Exception e) {
                    System.out.println("JavaCodeIndexer: 索引文件失败 (第二遍): " + file.getAbsolutePath());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            System.out.println("JavaCodeIndexer: 遍历目录失败: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("JavaCodeIndexer: 索引完成，节点数: " + graph.getNodes().size() + "，边数: " + graph.getEdges().size());
        return graph;
    }

    // 递归查找所有 Java 文件
    private List<File> findJavaFiles(File directory) {
        List<File> javaFiles = new ArrayList<>();
        if (!directory.exists() || !directory.isDirectory()) {
            return javaFiles;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return javaFiles;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                javaFiles.addAll(findJavaFiles(file));
            } else if (file.getName().endsWith(".java")) {
                javaFiles.add(file);
            }
        }

        return javaFiles;
    }

    private void indexFileFirstPass(KnowledgeGraph graph, File file) throws FileNotFoundException {
        ParseResult<CompilationUnit> result = javaParser.parse(file);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            return;
        }

        CompilationUnit cu = result.getResult().get();
        String fileId = UUID.randomUUID().toString();

        // 创建文件节点
        GraphNode fileNode = GraphNode.builder()
                .id(fileId)
                .type("FILE")
                .name(file.getName())
                .filePath(file.getAbsolutePath())
                .build();
        graph.addNode(fileNode);

        // 处理类和接口
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String classId = UUID.randomUUID().toString();
            String qualifiedName = clazz.getFullyQualifiedName().orElse(clazz.getNameAsString());

            GraphNode classNode = GraphNode.builder()
                    .id(classId)
                    .type(clazz.isInterface() ? "INTERFACE" : "CLASS")
                    .name(clazz.getNameAsString())
                    .qualifiedName(qualifiedName)
                    .filePath(file.getAbsolutePath())
                    .parentId(fileId)
                    .build();
            graph.addNode(classNode);
            classNameToId.put(qualifiedName, classId);

            // 类包含在文件中
            graph.addEdge(GraphEdge.builder()
                    .id(UUID.randomUUID().toString())
                    .sourceId(fileId)
                    .targetId(classId)
                    .type("CONTAINS")
                    .build());

            // 处理继承关系
            clazz.getExtendedTypes().forEach(ext -> {
                String parentQualifiedName = ext.getNameAsString();
                GraphNode parentNode = graph.findNodeByQualifiedName(parentQualifiedName);
                if (parentNode != null) {
                    graph.addEdge(GraphEdge.builder()
                            .id(UUID.randomUUID().toString())
                            .sourceId(classId)
                            .targetId(parentNode.getId())
                            .type("EXTENDS")
                            .build());
                }
            });

            // 处理实现关系
            clazz.getImplementedTypes().forEach(impl -> {
                String implQualifiedName = impl.getNameAsString();
                GraphNode implNode = graph.findNodeByQualifiedName(implQualifiedName);
                if (implNode != null) {
                    graph.addEdge(GraphEdge.builder()
                            .id(UUID.randomUUID().toString())
                            .sourceId(classId)
                            .targetId(implNode.getId())
                            .type("IMPLEMENTS")
                            .build());
                }
            });
        });
    }

    private void indexFileSecondPass(KnowledgeGraph graph, File file) throws FileNotFoundException {
        ParseResult<CompilationUnit> result = javaParser.parse(file);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            return;
        }

        CompilationUnit cu = result.getResult().get();

        // 先处理文件节点（从 graph 中获取）
        GraphNode fileNode = graph.getNodes().values().stream()
                .filter(n -> "FILE".equals(n.getType()) && file.getAbsolutePath().equals(n.getFilePath()))
                .findFirst()
                .orElse(null);
        if (fileNode == null) {
            return;
        }
        String fileId = fileNode.getId();

        // 处理导入关系
        cu.findAll(ImportDeclaration.class).forEach(imp -> {
            String importedName = imp.getNameAsString();
            GraphNode importedNode = graph.findNodeByQualifiedName(importedName);
            if (importedNode != null) {
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(importedNode.getId())
                        .type("IMPORTS")
                        .build());
            }
        });

        // 处理类和接口
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String qualifiedName = clazz.getFullyQualifiedName().orElse(clazz.getNameAsString());
            GraphNode classNode = graph.findNodeByQualifiedName(qualifiedName);
            if (classNode == null) {
                return;
            }
            String classId = classNode.getId();

            // 处理字段
            clazz.getFields().forEach(field -> {
                field.getVariables().forEach(var -> {
                    String fieldId = UUID.randomUUID().toString();
                    GraphNode fieldNode = GraphNode.builder()
                            .id(fieldId)
                            .type("FIELD")
                            .name(var.getNameAsString())
                            .qualifiedName(qualifiedName + "#" + var.getNameAsString())
                            .filePath(file.getAbsolutePath())
                            .parentId(classId)
                            .build();
                    graph.addNode(fieldNode);

                    // 字段包含在类中
                    graph.addEdge(GraphEdge.builder()
                            .id(UUID.randomUUID().toString())
                            .sourceId(classId)
                            .targetId(fieldId)
                            .type("CONTAINS")
                            .build());
                });
            });

            // 处理方法
            clazz.getMethods().forEach(method -> {
                String methodId = UUID.randomUUID().toString();
                GraphNode methodNode = GraphNode.builder()
                        .id(methodId)
                        .type("METHOD")
                        .name(method.getNameAsString())
                        .qualifiedName(qualifiedName + "#" + method.getNameAsString())
                        .filePath(file.getAbsolutePath())
                        .parentId(classId)
                        .build();
                graph.addNode(methodNode);

                // 方法包含在类中
                graph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(classId)
                        .targetId(methodId)
                        .type("CONTAINS")
                        .build());

                // 解析方法调用
                method.findAll(MethodCallExpr.class).forEach(methodCall -> {
                    String calledMethodName = methodCall.getNameAsString();
                    // 简单尝试查找：当前类中的同名方法
                    String possibleTargetQualifiedName = qualifiedName + "#" + calledMethodName;
                    GraphNode targetMethodNode = graph.findNodeByQualifiedName(possibleTargetQualifiedName);
                    if (targetMethodNode != null) {
                        graph.addEdge(GraphEdge.builder()
                                .id(UUID.randomUUID().toString())
                                .sourceId(methodId)
                                .targetId(targetMethodNode.getId())
                                .type("CALLS")
                                .build());
                    }
                });
            });
        });
    }

    @Override
    public String[] getSupportedLanguages() {
        return new String[]{"java"};
    }
}
