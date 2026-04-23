package org.xi.lt.flow.staticparser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;
import org.xi.lt.flow.staticfilter.StaticFilterConfig;
import org.xi.lt.flow.staticmodel.MethodEntry;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 增强版 Java 代码解析器
 * 支持：入口方法选择、调用深度控制、配置化过滤
 */
@Slf4j
public class EnhancedJavaCodeParser {

    private final JavaParser javaParser;
    private final StaticFilterConfig filterConfig;

    public EnhancedJavaCodeParser() {
        this(StaticFilterConfig.defaultConfig());
    }

    public EnhancedJavaCodeParser(StaticFilterConfig filterConfig) {
        this.javaParser = new JavaParser();
        this.filterConfig = filterConfig;
    }

    /**
     * 提取所有可选的入口方法
     */
    public List<MethodEntry> extractEntryMethods(File javaFile) throws FileNotFoundException {
        ParseResult<CompilationUnit> result = javaParser.parse(javaFile);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            log.error("解析文件失败: {}", javaFile.getAbsolutePath());
            return Collections.emptyList();
        }

        CompilationUnit cu = result.getResult().get();
        List<MethodEntry> entries = new ArrayList<>();

        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String className = clazz.getFullyQualifiedName().isPresent() ?
                    clazz.getFullyQualifiedName().get() : clazz.getNameAsString();
            String simpleClassName = clazz.getNameAsString();

            clazz.getMethods().forEach(method -> {
                String methodName = method.getNameAsString();
                String methodId = className + "#" + methodName;

                // 判断访问修饰符
                String accessModifier = getAccessModifier(method);
                boolean isPublic = method.isPublic();
                boolean isMainMethod = isMainMethod(method);
                boolean isConstructor = method.isConstructorDeclaration();

                // 构建显示文本
                String displayText = buildDisplayText(simpleClassName, methodName, method.getDeclarationAsString(false, false, false));

                MethodEntry entry = MethodEntry.builder()
                        .id(methodId)
                        .className(className)
                        .simpleClassName(simpleClassName)
                        .methodName(methodName)
                        .methodSignature(method.getDeclarationAsString(false, false, false))
                        .accessModifier(accessModifier)
                        .isPublic(isPublic)
                        .isMainMethod(isMainMethod)
                        .isConstructor(isConstructor)
                        .displayText(displayText)
                        .build();

                entries.add(entry);
            });
        });

        // 按 main 方法优先、public 方法优先排序
        return entries.stream()
                .sorted(Comparator.comparing(MethodEntry::isMainMethod).reversed()
                        .thenComparing(MethodEntry::isPublic).reversed()
                        .thenComparing(MethodEntry::getMethodName))
                .collect(Collectors.toList());
    }

    /**
     * 解析单个Java文件，从指定入口方法开始
     */
    public FlowGraph parseFileFromEntry(File javaFile, String entryMethodId) throws FileNotFoundException {
        log.info("开始解析文件: {}, 入口方法: {}", javaFile.getAbsolutePath(), entryMethodId);

        ParseResult<CompilationUnit> result = javaParser.parse(javaFile);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            log.error("解析文件失败: {}", javaFile.getAbsolutePath());
            throw new RuntimeException("无法解析文件: " + javaFile.getAbsolutePath());
        }

        CompilationUnit cu = result.getResult().get();
        FlowGraph graph = FlowGraph.builder()
                .name(cleanFileName(javaFile.getName()))
                .description("从文件 " + javaFile.getAbsolutePath() + " 生成的流程图，入口: " + entryMethodId)
                .build();

        // 提取所有类和方法
        extractClassesAndMethods(cu, graph);

        // 从入口方法开始，按深度提取调用链
        if (entryMethodId != null && !entryMethodId.isEmpty()) {
            extractMethodCallsFromEntry(cu, graph, entryMethodId);
        } else {
            extractMethodCalls(cu, graph);
        }

        log.info("解析完成！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());
        return graph;
    }

    /**
     * 解析单个Java文件，使用完整图
     */
    public FlowGraph parseFile(File javaFile) throws FileNotFoundException {
        return parseFileFromEntry(javaFile, null);
    }

    /**
     * 提取所有类和方法节点
     */
    private void extractClassesAndMethods(CompilationUnit cu, FlowGraph graph) {
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            String className = clazz.getFullyQualifiedName().isPresent() ?
                    clazz.getFullyQualifiedName().get() : clazz.getNameAsString();

            // 检查是否应该包含该类
            if (!filterConfig.shouldIncludeClass(className)) {
                log.debug("跳过类: {}", className);
                return;
            }

            // 创建类节点
            FlowNode classNode = FlowNode.builder()
                    .id(className)
                    .type(FlowNode.NodeType.CLASS)
                    .className(className)
                    .displayName(clazz.getNameAsString())
                    .build();
            graph.addNode(classNode);

            // 设置入口节点（第一个类）
            if (graph.getEntryNode() == null) {
                graph.setEntryNode(classNode);
            }

            // 提取方法
            clazz.getMethods().forEach(method -> {
                String methodName = method.getNameAsString();

                // 检查是否应该包含该方法
                if (!filterConfig.shouldIncludeMethod(methodName, className)) {
                    log.debug("跳过方法: {}#{}", className, methodName);
                    return;
                }

                String methodId = className + "#" + methodName;
                FlowNode methodNode = FlowNode.builder()
                        .id(methodId)
                        .type(FlowNode.NodeType.METHOD)
                        .className(className)
                        .methodName(methodName)
                        .methodSignature(method.getDeclarationAsString(false, false, false))
                        .displayName(methodName)
                        .build();
                graph.addNode(methodNode);

                // 不再创建类到方法的边 - 这些边会导致 "->" 节点问题
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
     * 从入口方法开始，按深度提取调用链
     */
    private void extractMethodCallsFromEntry(CompilationUnit cu, FlowGraph graph, String entryMethodId) {
        Map<String, Integer> visitedDepths = new HashMap<>();
        Queue<MethodCallFrame> queue = new LinkedList<>();

        // 找到入口方法节点
        FlowNode entryNode = graph.getNode(entryMethodId);
        if (entryNode != null) {
            queue.add(new MethodCallFrame(entryNode, 0, null));
            visitedDepths.put(entryMethodId, 0);
        }

        // BFS 遍历
        while (!queue.isEmpty()) {
            MethodCallFrame frame = queue.poll();
            FlowNode currentNode = frame.node;
            int currentDepth = frame.depth;

            // 超过最大深度，停止
            if (currentDepth >= filterConfig.getMaxDepth()) {
                continue;
            }

            // 找到对应的方法声明，分析调用
            findAndProcessMethodCalls(cu, graph, currentNode, currentDepth + 1, queue, visitedDepths);
        }
    }

    /**
     * 查找并处理方法调用
     */
    private void findAndProcessMethodCalls(CompilationUnit cu, FlowGraph graph,
                                             FlowNode currentNode, int nextDepth,
                                             Queue<MethodCallFrame> queue,
                                             Map<String, Integer> visitedDepths) {
        String className = currentNode.getClassName();
        String methodName = currentNode.getMethodName();

        if (className == null || methodName == null) {
            return;
        }

        // 找到对应的 MethodDeclaration
        cu.findAll(MethodDeclaration.class).stream()
                .filter(m -> methodName.equals(m.getNameAsString()))
                .filter(m -> {
                    String declaringClassName = m.findAncestor(ClassOrInterfaceDeclaration.class)
                            .map(c -> c.getFullyQualifiedName().isPresent() ?
                                    c.getFullyQualifiedName().get() : c.getNameAsString())
                            .orElse("");
                    return className.equals(declaringClassName);
                })
                .findFirst()
                .ifPresent(method -> {
                    // 分析方法体内的调用
                    method.accept(new VoidVisitorAdapter<Void>() {
                        @Override
                        public void visit(MethodCallExpr call, Void arg) {
                            super.visit(call, arg);

                            String calledMethodName = call.getNameAsString();
                            String calledClassName = call.getScope()
                                    .map(scope -> scope.toString())
                                    .orElse(className);

                            // 检查是否应该包含被调用的类/方法
                            if (!filterConfig.shouldIncludeClass(calledClassName) ||
                                    !filterConfig.shouldIncludeMethod(calledMethodName)) {
                                return;
                            }

                            String targetMethodId = calledClassName + "#" + calledMethodName;
                            FlowNode targetNode = graph.getNode(targetMethodId);

                            // 如果找不到，创建一个简单节点
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
                                    .source(currentNode)
                                    .target(targetNode)
                                    .callType(FlowEdge.CallType.DIRECT)
                                    .callCount(1)
                                    .build();
                            graph.addEdge(edge);

                            // 如果未访问过，加入队列
                            Integer existingDepth = visitedDepths.get(targetMethodId);
                            if (existingDepth == null || nextDepth < existingDepth) {
                                visitedDepths.put(targetMethodId, nextDepth);
                                queue.add(new MethodCallFrame(targetNode, nextDepth, currentNode));
                            }
                        }
                    }, null);
                });
    }

    /**
     * 提取所有方法调用关系（不限制深度）
     */
    private void extractMethodCalls(CompilationUnit cu, FlowGraph graph) {
        cu.findAll(MethodDeclaration.class).forEach(method -> {
            String className = method.findAncestor(ClassOrInterfaceDeclaration.class)
                    .map(clazz -> clazz.getFullyQualifiedName().isPresent() ?
                            clazz.getFullyQualifiedName().get() : clazz.getNameAsString())
                    .orElse("Unknown");
            String methodId = className + "#" + method.getNameAsString();
            FlowNode sourceNode = graph.getNode(methodId);

            if (sourceNode == null) {
                return;
            }

            // 访问方法体中的所有方法调用
            method.accept(new VoidVisitorAdapter<Void>() {
                @Override
                public void visit(MethodCallExpr call, Void arg) {
                    super.visit(call, arg);

                    String calledMethodName = call.getNameAsString();
                    String calledClassName = call.getScope()
                            .map(scope -> scope.toString())
                            .orElse(className);

                    // 检查过滤
                    if (!filterConfig.shouldIncludeClass(calledClassName) ||
                            !filterConfig.shouldIncludeMethod(calledMethodName)) {
                        return;
                    }

                    String targetMethodId = calledClassName + "#" + calledMethodName;
                    FlowNode targetNode = graph.getNode(targetMethodId);

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
     * 获取访问修饰符
     */
    private String getAccessModifier(MethodDeclaration method) {
        if (method.isPublic()) return "public";
        if (method.isProtected()) return "protected";
        if (method.isPrivate()) return "private";
        return "default";
    }

    /**
     * 判断是否是 main 方法
     */
    private boolean isMainMethod(MethodDeclaration method) {
        return "main".equals(method.getNameAsString()) &&
                method.isPublic() &&
                method.isStatic() &&
                method.getType().isVoidType();
    }

    /**
     * 构建显示文本
     */
    private String buildDisplayText(String simpleClassName, String methodName, String signature) {
        return simpleClassName + "." + methodName + "()";
    }

    /**
     * 清理文件名，移除UUID前缀
     */
    private String cleanFileName(String fileName) {
        if (fileName == null) {
            return null;
        }
        // 移除UUID前缀（格式：UUID_OriginalFileName）
        int underscoreIndex = fileName.indexOf('_');
        if (underscoreIndex > 0 && underscoreIndex < 40) { // UUID是36字符
            String prefix = fileName.substring(0, underscoreIndex);
            // 检查是否是UUID格式（8-4-4-4-12）
            if (prefix.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
                return fileName.substring(underscoreIndex + 1);
            }
        }
        return fileName;
    }

    /**
     * 方法调用帧（用于 BFS 遍历）
     */
    private static class MethodCallFrame {
        final FlowNode node;
        final int depth;
        final FlowNode parent;

        MethodCallFrame(FlowNode node, int depth, FlowNode parent) {
            this.node = node;
            this.depth = depth;
            this.parent = parent;
        }
    }
}
