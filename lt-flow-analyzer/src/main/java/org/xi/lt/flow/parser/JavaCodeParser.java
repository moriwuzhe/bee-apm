package org.xi.lt.flow.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.*;

/**
 * Java代码解析器
 * 使用JavaParser解析Java源代码，提取方法调用链
 */
@Slf4j
public class JavaCodeParser {
    
    private final JavaParser javaParser;
    
    public JavaCodeParser() {
        this.javaParser = new JavaParser();
    }
    
    /**
     * 解析单个Java文件
     */
    public FlowGraph parseFile(File javaFile) throws FileNotFoundException {
        log.info("开始解析文件: {}", javaFile.getAbsolutePath());
        
        ParseResult<CompilationUnit> result = javaParser.parse(javaFile);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            log.error("解析文件失败: {}", javaFile.getAbsolutePath());
            if (result.getProblems() != null) {
                for (com.github.javaparser.Problem problem : result.getProblems()) {
                    log.error("解析问题: {}", problem.getMessage());
                }
            }
            throw new RuntimeException("无法解析文件: " + javaFile.getAbsolutePath());
        }
        
        CompilationUnit cu = result.getResult().get();
        FlowGraph graph = FlowGraph.builder()
                .name(javaFile.getName())
                .description("从文件 " + javaFile.getAbsolutePath() + " 生成的流程图")
                .build();
        
        // 提取所有类和方法
        extractClassesAndMethods(cu, graph);
        
        // 提取方法调用关系
        extractMethodCalls(cu, graph);
        
        log.info("解析完成！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());
        return graph;
    }
    
    /**
     * 检查节点的任何字段是否包含 "->"
     */
    private boolean hasArrowInAnyField(String className, String methodName, String displayName) {
        return (className != null && (className.equals("->") || className.contains("->"))) ||
               (methodName != null && (methodName.equals("->") || methodName.contains("->"))) ||
               (displayName != null && (displayName.equals("->") || displayName.contains("->")));
    }

    /**
     * 提取所有类和方法节点
     */
    private void extractClassesAndMethods(CompilationUnit cu, FlowGraph graph) {
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String className = clazz.getFullyQualifiedName().isPresent() ?
                    clazz.getFullyQualifiedName().get() : clazz.getNameAsString();

            // 检查是否包含 "->"
            if (hasArrowInAnyField(className, null, null)) {
                return;
            }

            // 创建类节点（暂时不添加到图中，避免问题）
            // FlowNode classNode = FlowNode.builder()
            //         .id(className)
            //         .type(FlowNode.NodeType.CLASS)
            //         .className(className)
            //         .displayName(clazz.getNameAsString())
            //         .build();
            // graph.addNode(classNode);

            // 设置入口节点（第一个类）
            // if (graph.getEntryNode() == null) {
            //     graph.setEntryNode(classNode);
            // }

            // 提取方法
            clazz.getMethods().forEach(method -> {
                String methodName = method.getNameAsString();
                String displayName = methodName;
                String methodSignature = method.getDeclarationAsString(false, false, false);
                String methodId = className + "#" + methodName;

                // 严格检查所有字段
                if (hasArrowInAnyField(className, methodName, displayName) ||
                    hasArrowInAnyField(className, methodName, methodId) ||
                    (methodSignature != null && (methodSignature.equals("->") || methodSignature.contains("->")))) {
                    return;
                }

                FlowNode methodNode = FlowNode.builder()
                        .id(methodId)
                        .type(FlowNode.NodeType.METHOD)
                        .className(className)
                        .methodName(methodName)
                        .methodSignature(methodSignature)
                        .displayName(displayName)
                        .build();
                graph.addNode(methodNode);

                // 创建类到方法的边（暂时注释，避免问题）
                // FlowEdge edge = FlowEdge.builder()
                //         .source(classNode)
                //         .target(methodNode)
                //         .callType(FlowEdge.CallType.DIRECT)
                //         .build();
                // graph.addEdge(edge);
            });
        });
    }
    
    /**
     * 提取方法调用关系
     */
    private void extractMethodCalls(CompilationUnit cu, FlowGraph graph) {
        cu.findAll(MethodDeclaration.class).forEach(method -> {
            String className = method.findAncestor(ClassOrInterfaceDeclaration.class)
                    .map(clazz -> clazz.getFullyQualifiedName().isPresent() ?
                            clazz.getFullyQualifiedName().get() : clazz.getNameAsString())
                    .orElse("Unknown");
            String methodName = method.getNameAsString();

            if (hasArrowInAnyField(className, methodName, methodName)) {
                return;
            }

            String methodId = className + "#" + methodName;
            FlowNode sourceNode = graph.getNode(methodId);

            if (sourceNode == null) {
                return;
            }

            // 访问方法体中的所有方法调用
            method.accept(new VoidVisitorAdapter<Void>() {
                @Override
                public void visit(MethodCallExpr call, Void arg) {
                    super.visit(call, arg);

                    // 提取被调用的方法信息
                    String calledMethodName = call.getNameAsString();
                    String calledClassName = call.getScope()
                            .map(scope -> scope.toString())
                            .orElse(className);
                    String targetMethodId = calledClassName + "#" + calledMethodName;

                    // 最严格的检查 ->
                    if (hasArrowInAnyField(calledClassName, calledMethodName, calledMethodName) ||
                        hasArrowInAnyField(calledClassName, calledMethodName, targetMethodId) ||
                        calledMethodName.equals("->") ||
                        calledClassName.equals("->") ||
                        targetMethodId.contains("->")) {
                        return;
                    }

                    // 尝试找到目标节点
                    FlowNode targetNode = graph.getNode(targetMethodId);

                    // 如果找不到，先创建一个简单节点
                    if (targetNode == null) {
                        targetNode = FlowNode.builder()
                                .id(targetMethodId)
                                .type(FlowNode.NodeType.METHOD)
                                .className(calledClassName)
                                .methodName(calledMethodName)
                                .displayName(calledMethodName)
                                .build();
                        graph.addNode(targetNode);
                    }

                    // 创建调用边
                    FlowEdge edge = FlowEdge.builder()
                            .source(sourceNode)
                            .target(targetNode)
                            .callType(FlowEdge.CallType.DIRECT)
                            .callCount(1)
                            .build();
                    graph.addEdge(edge);
                }
            }, null);
        });
    }
    
    /**
     * 解析目录下的所有Java文件
     */
    public FlowGraph parseDirectory(File directory) {
        if (!directory.isDirectory()) {
            throw new IllegalArgumentException("不是目录: " + directory.getAbsolutePath());
        }
        
        log.info("开始解析目录: {}", directory.getAbsolutePath());
        
        FlowGraph combinedGraph = FlowGraph.builder()
                .name(directory.getName())
                .description("从目录 " + directory.getAbsolutePath() + " 生成的流程图")
                .build();
        
        // 递归解析所有Java文件
        parseDirectoryRecursive(directory, combinedGraph);
        
        log.info("目录解析完成！节点数: {}, 边数: {}", 
                combinedGraph.getNodeCount(), combinedGraph.getEdgeCount());
        return combinedGraph;
    }
    
    private void parseDirectoryRecursive(File directory, FlowGraph combinedGraph) {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }
        
        for (File file : files) {
            if (file.isDirectory()) {
                parseDirectoryRecursive(file, combinedGraph);
            } else if (file.getName().endsWith(".java")) {
                try {
                    FlowGraph fileGraph = parseFile(file);
                    mergeGraphs(combinedGraph, fileGraph);
                } catch (Exception e) {
                    log.warn("解析文件失败: {}, 跳过", file.getAbsolutePath(), e);
                }
            }
        }
    }
    
    /**
     * 合并两个流程图
     */
    private void mergeGraphs(FlowGraph target, FlowGraph source) {
        // 合并节点
        for (FlowNode node : source.getAllNodes()) {
            if (target.getNode(node.getFullId()) == null) {
                target.addNode(node);
            }
        }
        
        // 合并边
        for (FlowEdge edge : source.getEdges()) {
            // 重新查找节点（可能已经被合并）
            FlowNode sourceNode = target.getNode(edge.getSource().getFullId());
            FlowNode targetNode = target.getNode(edge.getTarget().getFullId());
            
            if (sourceNode != null && targetNode != null) {
                FlowEdge mergedEdge = FlowEdge.builder()
                        .source(sourceNode)
                        .target(targetNode)
                        .callType(edge.getCallType())
                        .callCount(edge.getCallCount())
                        .condition(edge.getCondition())
                        .build();
                target.addEdge(mergedEdge);
            }
        }
        
        // 设置入口节点
        if (target.getEntryNode() == null && source.getEntryNode() != null) {
            target.setEntryNode(target.getNode(source.getEntryNode().getFullId()));
        }
    }
}
