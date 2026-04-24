package org.xi.lt.code.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Java 代码索引器 - 把代码库解析成知识图谱
 */
public class JavaCodeIndexer {

    private final JavaParser javaParser = new JavaParser();

    public KnowledgeGraph indexRepository(String repoPath) throws IOException {
        KnowledgeGraph graph = KnowledgeGraph.builder()
                .repoPath(repoPath)
                .build();

        // 遍历目录
        try (Stream<Path> paths = Files.walk(Paths.get(repoPath))) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .forEach(path -> {
                        try {
                            indexFile(graph, path.toFile());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
        }

        return graph;
    }

    private void indexFile(KnowledgeGraph graph, File file) throws FileNotFoundException {
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

            // 类包含在文件中
            graph.addEdge(GraphEdge.builder()
                    .id(UUID.randomUUID().toString())
                    .sourceId(fileId)
                    .targetId(classId)
                    .type("CONTAINS")
                    .build());

            // 处理继承关系
            clazz.getExtendedTypes().forEach(ext -> {
                GraphNode parentNode = graph.findNodeByQualifiedName(ext.getNameAsString());
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
                GraphNode implNode = graph.findNodeByQualifiedName(impl.getNameAsString());
                if (implNode != null) {
                    graph.addEdge(GraphEdge.builder()
                            .id(UUID.randomUUID().toString())
                            .sourceId(classId)
                            .targetId(implNode.getId())
                            .type("IMPLEMENTS")
                            .build());
                }
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
            });
        });
    }
}
