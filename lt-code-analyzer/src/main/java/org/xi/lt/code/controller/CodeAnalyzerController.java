package org.xi.lt.code.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;
import org.xi.lt.code.parser.CodeIndexer;
import org.xi.lt.code.parser.CodeIndexerFactory;

import java.io.File;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 代码分析器 REST API
 */
@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "*")
public class CodeAnalyzerController {

    // 不再使用单独的 JavaCodeIndexer，而是使用 CodeIndexerFactory

    // 缓存索引后的图
    private KnowledgeGraph cachedGraph = null;

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("service", "Code Analyzer");
        result.put("version", "0.1");
        return result;
    }

    /**
     * 索引代码库
     */
    @PostMapping("/index")
    public IndexResponse indexRepository(@RequestBody IndexRequest request) {
        System.out.println("CodeAnalyzerController: 接收到索引请求");
        System.out.println("CodeAnalyzerController: 代码库路径: " + request.getRepoPath());
        
        // 简单的错误处理
        if (request.getRepoPath() == null || request.getRepoPath().isEmpty()) {
            System.out.println("CodeAnalyzerController: 代码库路径为空");
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不能为空")
                    .build();
        }
        
        File repoDir = new File(request.getRepoPath());
        if (!repoDir.exists()) {
            System.out.println("CodeAnalyzerController: 代码库路径不存在: " + request.getRepoPath());
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不存在")
                    .build();
        }
        
        if (!repoDir.isDirectory()) {
            System.out.println("CodeAnalyzerController: 代码库路径不是目录: " + request.getRepoPath());
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不是目录")
                    .build();
        }
        
        try {
            System.out.println("CodeAnalyzerController: 开始索引代码库");
            // 创建一个新的知识图谱
            KnowledgeGraph graph = KnowledgeGraph.builder()
                    .repoPath(request.getRepoPath())
                    .build();

            // 遍历目录，根据文件类型选择合适的索引器
            indexDirectory(graph, repoDir);

            cachedGraph = graph;
            System.out.println("CodeAnalyzerController: 索引完成，节点数: " + cachedGraph.getNodes().size() + "，边数: " + cachedGraph.getEdges().size());
            return IndexResponse.builder()
                    .success(true)
                    .nodeCount(cachedGraph.getNodes().size())
                    .edgeCount(cachedGraph.getEdges().size())
                    .build();
        } catch (Exception e) {
            System.out.println("CodeAnalyzerController: 索引失败: " + e.getMessage());
            e.printStackTrace();
            return IndexResponse.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    // 递归索引目录
    private void indexDirectory(KnowledgeGraph graph, File directory) throws Exception {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                // 递归索引子目录
                indexDirectory(graph, file);
            } else {
                // 根据文件扩展名选择合适的索引器
                String fileName = file.getName();
                int dotIndex = fileName.lastIndexOf('.');
                if (dotIndex > 0) {
                    String extension = fileName.substring(dotIndex + 1);
                    CodeIndexer indexer = CodeIndexerFactory.getIndexerByExtension(extension);
                    if (indexer != null) {
                        // 为每种语言创建一个临时图谱，然后合并到主图谱
                        KnowledgeGraph languageGraph = indexer.indexRepository(file.getParent());
                        mergeGraphs(graph, languageGraph);
                    }
                }
            }
        }
    }

    // 合并两个知识图谱
    private void mergeGraphs(KnowledgeGraph target, KnowledgeGraph source) {
        // 合并节点
        source.getNodes().forEach((id, node) -> {
            if (!target.getNodes().containsKey(id)) {
                target.addNode(node);
            }
        });

        // 合并边
        source.getEdges().forEach(edge -> {
            // 检查边是否已存在
            boolean edgeExists = target.getEdges().stream()
                    .anyMatch(e -> e.getId().equals(edge.getId()));
            if (!edgeExists) {
                target.addEdge(edge);
            }
        });
    }

    /**
     * 获取知识图谱
     */
    @GetMapping("/graph")
    public KnowledgeGraph getGraph() {
        if (cachedGraph == null) {
            // 返回一个默认的知识图谱
            cachedGraph = KnowledgeGraph.builder()
                    .repoPath("./src")
                    .build();
            
            // 添加一些测试节点
            try {
                // 添加文件节点
                String fileId = UUID.randomUUID().toString();
                GraphNode fileNode = GraphNode.builder()
                        .id(fileId)
                        .type("FILE")
                        .name("CodeAnalyzerApplication.java")
                        .filePath("./src/main/java/org/xi/lt/code/CodeAnalyzerApplication.java")
                        .build();
                cachedGraph.addNode(fileNode);
                
                // 添加类节点
                String classId = UUID.randomUUID().toString();
                GraphNode classNode = GraphNode.builder()
                        .id(classId)
                        .type("CLASS")
                        .name("CodeAnalyzerApplication")
                        .qualifiedName("org.xi.lt.code.CodeAnalyzerApplication")
                        .filePath("./src/main/java/org/xi/lt/code/CodeAnalyzerApplication.java")
                        .parentId(fileId)
                        .build();
                cachedGraph.addNode(classNode);
                
                // 添加方法节点
                String methodId = UUID.randomUUID().toString();
                GraphNode methodNode = GraphNode.builder()
                        .id(methodId)
                        .type("METHOD")
                        .name("main")
                        .qualifiedName("org.xi.lt.code.CodeAnalyzerApplication#main")
                        .filePath("./src/main/java/org/xi/lt/code/CodeAnalyzerApplication.java")
                        .parentId(classId)
                        .build();
                cachedGraph.addNode(methodNode);
                
                // 添加边
                cachedGraph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(fileId)
                        .targetId(classId)
                        .type("CONTAINS")
                        .build());
                
                cachedGraph.addEdge(GraphEdge.builder()
                        .id(UUID.randomUUID().toString())
                        .sourceId(classId)
                        .targetId(methodId)
                        .type("CONTAINS")
                        .build());
            } catch (Exception e) {
                System.out.println("CodeAnalyzerController: 创建默认知识图谱失败: " + e.getMessage());
                e.printStackTrace();
            }
        }
        return cachedGraph;
    }

    /**
     * P0 功能 2: Context 查询 - 查询一个节点的上下文（谁调用它，它调用谁）
     */
    @GetMapping("/context/{nodeId}")
    public ContextResponse getContext(@PathVariable String nodeId) {
        if (cachedGraph == null) {
            return ContextResponse.builder().error("No index found, please index first").build();
        }

        GraphNode node = cachedGraph.getNode(nodeId);
        if (node == null) {
            return ContextResponse.builder().error("Node not found").build();
        }

        // 找入边（谁调用/包含它）
        List<GraphEdge> incomingEdges = cachedGraph.getEdges().stream()
                .filter(e -> nodeId.equals(e.getTargetId()))
                .collect(Collectors.toList());

        // 找出边（它调用/包含谁）
        List<GraphEdge> outgoingEdges = cachedGraph.getEdges().stream()
                .filter(e -> nodeId.equals(e.getSourceId()))
                .collect(Collectors.toList());

        return ContextResponse.builder()
                .node(node)
                .incomingEdges(incomingEdges)
                .outgoingEdges(outgoingEdges)
                .build();
    }

    /**
     * P1 功能 1: Impact Analysis（影响分析） - 分析修改一个节点的影响范围
     */
    @GetMapping("/impact/{nodeId}")
    public ImpactResponse getImpact(@PathVariable String nodeId) {
        if (cachedGraph == null) {
            return ImpactResponse.builder().error("No index found, please index first").build();
        }

        GraphNode node = cachedGraph.getNode(nodeId);
        if (node == null) {
            return ImpactResponse.builder().error("Node not found").build();
        }

        // BFS 找出所有可能受影响的节点（入边方向：谁调用它）
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(nodeId);
        visited.add(nodeId);

        Map<String, List<GraphNode>> impactMap = new HashMap<>();
        List<GraphNode> upstream = new ArrayList<>();
        List<GraphNode> downstream = new ArrayList<>();

        // 上游影响（谁调用它）
        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            List<GraphEdge> edges = cachedGraph.getEdges().stream()
                    .filter(e -> "CALLS".equals(e.getType()) && currentId.equals(e.getTargetId()))
                    .collect(Collectors.toList());
            for (GraphEdge edge : edges) {
                if (!visited.contains(edge.getSourceId())) {
                    visited.add(edge.getSourceId());
                    GraphNode upstreamNode = cachedGraph.getNode(edge.getSourceId());
                    if (upstreamNode != null) {
                        upstream.add(upstreamNode);
                        queue.add(edge.getSourceId());
                    }
                }
            }
        }

        // 下游影响（它调用谁）
        visited.clear();
        queue.add(nodeId);
        visited.add(nodeId);
        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            List<GraphEdge> edges = cachedGraph.getEdges().stream()
                    .filter(e -> "CALLS".equals(e.getType()) && currentId.equals(e.getSourceId()))
                    .collect(Collectors.toList());
            for (GraphEdge edge : edges) {
                if (!visited.contains(edge.getTargetId())) {
                    visited.add(edge.getTargetId());
                    GraphNode downstreamNode = cachedGraph.getNode(edge.getTargetId());
                    if (downstreamNode != null) {
                        downstream.add(downstreamNode);
                        queue.add(edge.getTargetId());
                    }
                }
            }
        }

        // 简单风险评估（节点数）
        String riskLevel = "LOW";
        if (upstream.size() + downstream.size() > 10) {
            riskLevel = "HIGH";
        } else if (upstream.size() + downstream.size() > 3) {
            riskLevel = "MEDIUM";
        }

        return ImpactResponse.builder()
                .node(node)
                .upstreamImpact(upstream)
                .downstreamImpact(downstream)
                .totalImpactCount(upstream.size() + downstream.size())
                .riskLevel(riskLevel)
                .build();
    }

    /**
     * P2 功能 1: Detect Changes - 分析文件变更的影响范围
     */
    @PostMapping("/detectChanges")
    public DetectChangesResponse detectChanges(@RequestBody DetectChangesRequest request) {
        if (cachedGraph == null) {
            return DetectChangesResponse.builder().error("No index found, please index first").build();
        }
        // 简化版本：根据文件路径找出相关节点，然后执行Impact Analysis
        List<GraphNode> changedNodes = cachedGraph.getNodes().values().stream()
                .filter(n -> request.getChangedFiles().stream().anyMatch(f -> n.getFilePath() != null && n.getFilePath().contains(f)))
                .collect(Collectors.toList());
        List<GraphNode> allImpacted = new ArrayList<>();
        for (GraphNode node : changedNodes) {
            ImpactResponse impact = getImpact(node.getId());
            if (impact.getUpstreamImpact() != null) allImpacted.addAll(impact.getUpstreamImpact());
            if (impact.getDownstreamImpact() != null) allImpacted.addAll(impact.getDownstreamImpact());
        }
        // 去重
        Set<String> seenIds = new HashSet<>();
        List<GraphNode> uniqueImpacted = new ArrayList<>();
        for (GraphNode n : allImpacted) {
            if (!seenIds.contains(n.getId())) {
                seenIds.add(n.getId());
                uniqueImpacted.add(n);
            }
        }
        String riskLevel = "LOW";
        if (uniqueImpacted.size() > 10) riskLevel = "HIGH";
        else if (uniqueImpacted.size() > 3) riskLevel = "MEDIUM";
        return DetectChangesResponse.builder()
                .changedNodes(changedNodes)
                .impactedNodes(uniqueImpacted)
                .totalImpactCount(uniqueImpacted.size())
                .riskLevel(riskLevel)
                .build();
    }

    /**
     * P2 功能 2: 基础过滤查询（简化版本的Cypher查询）
     */
    @PostMapping("/query")
    public QueryResponse query(@RequestBody QueryRequest request) {
        if (cachedGraph == null) {
            return QueryResponse.builder().error("No index found, please index first").build();
        }
        List<GraphNode> results = cachedGraph.getNodes().values().stream()
                .filter(n -> {
                    boolean match = true;
                    if (request.getNodeType() != null && request.getNodeType().length() > 0) {
                        match = match && request.getNodeType().equals(n.getType());
                    }
                    if (request.getNameContains() != null && request.getNameContains().length() > 0) {
                        match = match && (n.getName() != null && n.getName().contains(request.getNameContains()));
                    }
                    return match;
                })
                .collect(Collectors.toList());
        return QueryResponse.builder().nodes(results).nodeCount(results.size()).build();
    }

    /**
     * P3 功能 1: API Route Map - API 路由 → 处理函数 → 消费者的映射
     */
    @GetMapping("/apiRouteMap")
    public ApiRouteMapResponse getApiRouteMap() {
        if (cachedGraph == null) {
            return ApiRouteMapResponse.builder().error("No index found, please index first").build();
        }

        // 查找所有控制器类
        List<GraphNode> controllerClasses = cachedGraph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName().contains("Controller"))
                .collect(Collectors.toList());

        // 构建 API 路由映射
        List<ApiRoute> apiRoutes = new ArrayList<>();
        for (GraphNode controllerClass : controllerClasses) {
            // 查找控制器类中的方法
            List<GraphNode> methods = cachedGraph.getNodes().values().stream()
                    .filter(n -> "METHOD".equals(n.getType()) && controllerClass.getId().equals(n.getParentId()))
                    .collect(Collectors.toList());

            // 为每个方法创建 API 路由
            for (GraphNode method : methods) {
                // 简化版本：根据方法名推断 API 路由
                String route = "/api/" + controllerClass.getName().replace("Controller", "").toLowerCase() + "/" + method.getName().toLowerCase();
                ApiRoute apiRoute = ApiRoute.builder()
                        .route(route)
                        .controllerClass(controllerClass.getName())
                        .methodName(method.getName())
                        .build();
                apiRoutes.add(apiRoute);
            }
        }

        return ApiRouteMapResponse.builder()
                .apiRoutes(apiRoutes)
                .routeCount(apiRoutes.size())
                .build();
    }

    /**
     * P0 功能 8: MCP 工具 - 给 AI 助手提供代码查询能力
     */
    @PostMapping("/mcp/query")
    public MCPQueryResponse mcpQuery(@RequestBody MCPQueryRequest request) {
        if (cachedGraph == null) {
            return MCPQueryResponse.builder().error("No index found, please index first").build();
        }

        // 处理不同类型的查询
        switch (request.getQueryType()) {
            case "findClass":
                return findClass(request.getQuery());
            case "findMethod":
                return findMethod(request.getQuery());
            case "findField":
                return findField(request.getQuery());
            case "findUsage":
                return findUsage(request.getQuery());
            default:
                return MCPQueryResponse.builder().error("Unknown query type").build();
        }
    }

    // 查找类
    private MCPQueryResponse findClass(String query) {
        List<GraphNode> classes = cachedGraph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(classes)
                .resultCount(classes.size())
                .build();
    }

    // 查找方法
    private MCPQueryResponse findMethod(String query) {
        List<GraphNode> methods = cachedGraph.getNodes().values().stream()
                .filter(n -> "METHOD".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(methods)
                .resultCount(methods.size())
                .build();
    }

    // 查找字段
    private MCPQueryResponse findField(String query) {
        List<GraphNode> fields = cachedGraph.getNodes().values().stream()
                .filter(n -> "FIELD".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(fields)
                .resultCount(fields.size())
                .build();
    }

    // 查找使用
    private MCPQueryResponse findUsage(String query) {
        // 查找包含查询字符串的所有节点
        List<GraphNode> results = cachedGraph.getNodes().values().stream()
                .filter(n -> n.getName() != null && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(results)
                .resultCount(results.size())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexRequest {
        private String repoPath;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexResponse {
        private boolean success;
        private Integer nodeCount;
        private Integer edgeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextResponse {
        private GraphNode node;
        private List<GraphEdge> incomingEdges;
        private List<GraphEdge> outgoingEdges;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactResponse {
        private GraphNode node;
        private List<GraphNode> upstreamImpact;
        private List<GraphNode> downstreamImpact;
        private Integer totalImpactCount;
        private String riskLevel;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectChangesRequest {
        private List<String> changedFiles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectChangesResponse {
        private List<GraphNode> changedNodes;
        private List<GraphNode> impactedNodes;
        private Integer totalImpactCount;
        private String riskLevel;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueryRequest {
        private String nodeType;
        private String nameContains;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueryResponse {
        private List<GraphNode> nodes;
        private Integer nodeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiRoute {
        private String route;
        private String controllerClass;
        private String methodName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiRouteMapResponse {
        private List<ApiRoute> apiRoutes;
        private Integer routeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MCPQueryRequest {
        private String queryType;
        private String query;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MCPQueryResponse {
        private List<GraphNode> results;
        private Integer resultCount;
        private String error;
    }
}
