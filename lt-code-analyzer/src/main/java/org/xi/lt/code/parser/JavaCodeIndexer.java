package org.xi.lt.code.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Java 代码索引器 - 把代码库解析成知识图谱
 */
public class JavaCodeIndexer {

    private final JavaParser javaParser = new JavaParser();

    // 临时存储：类名 -> 类节点 ID
    private Map<String, String> classNameToId = new HashMap<>();

    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        classNameToId.clear();
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 第一遍：先索引所有类和文件，构建 classNameToId
        try (Stream<Path> paths = Files.walk(Paths.get(repoPath))) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .forEach(path -> {
                        try {
                            indexFileFirstPass(graph, path.toFile());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
        }

        // 第二遍：索引方法和调用关系
        try (Stream<Path> paths = Files.walk(Paths.get(repoPath))) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .forEach(path -> {
                        try {
                            indexFileSecondPass(graph, path.toFile());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
        }

        return graph;
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

        // 处理类和接口
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String qualifiedName = clazz.getFullyQualifiedName().orElse(clazz.getNameAsString());
            GraphNode classNode = graph.findNodeByQualifiedName(qualifiedName);
            if (classNode == null) {
                return;
            }
            String classId = classNode.getId();

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
}
