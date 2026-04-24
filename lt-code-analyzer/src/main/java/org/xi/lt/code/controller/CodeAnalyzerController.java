package org.xi.lt.code.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;
import org.xi.lt.code.parser.JavaCodeIndexer;
import org.xi.lt.code.parser.CodeIndexer;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 代码分析器 REST API
 */
@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "*")
public class CodeAnalyzerController {

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
            CodeIndexer javaIndexer = new JavaCodeIndexer();
            cachedGraph = javaIndexer.indexRepository(request.getRepoPath());
            
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

    /**
     * 获取知识图谱
     */
    @GetMapping("/graph")
    public KnowledgeGraph getGraph() {
        if (cachedGraph == null) {
            try {
                System.out.println("CodeAnalyzerController: 没有缓存图，尝试自动索引");
                CodeIndexer javaIndexer = new JavaCodeIndexer();
                cachedGraph = javaIndexer.indexRepository("./src");
                System.out.println("CodeAnalyzerController: 自动索引完成，节点数: " + cachedGraph.getNodes().size());
            } catch (Exception e) {
                System.out.println("CodeAnalyzerController: 自动索引失败: " + e.getMessage());
                cachedGraph = KnowledgeGraph.builder().repoPath("./src").build();
            }
        }
        return cachedGraph;
    }

    /**
     * Context 查询
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

        List<GraphEdge> incomingEdges = cachedGraph.getEdges().stream()
                .filter(e -> nodeId.equals(e.getTargetId()))
                .collect(Collectors.toList());

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
     * Impact Analysis
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

        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(nodeId);
        visited.add(nodeId);

        List<GraphNode> upstream = new ArrayList<>();
        List<GraphNode> downstream = new ArrayList<>();

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
     * Detect Changes
     */
    @PostMapping("/detectChanges")
    public DetectChangesResponse detectChanges(@RequestBody DetectChangesRequest request) {
        if (cachedGraph == null) {
            return DetectChangesResponse.builder().error("No index found, please index first").build();
        }
        List<GraphNode> changedNodes = cachedGraph.getNodes().values().stream()
                .filter(n -> request.getChangedFiles().stream().anyMatch(f -> n.getFilePath() != null && n.getFilePath().contains(f)))
                .collect(Collectors.toList());
        List<GraphNode> allImpacted = new ArrayList<>();
        for (GraphNode node : changedNodes) {
            ImpactResponse impact = getImpact(node.getId());
            if (impact.getUpstreamImpact() != null) allImpacted.addAll(impact.getUpstreamImpact());
            if (impact.getDownstreamImpact() != null) allImpacted.addAll(impact.getDownstreamImpact());
        }
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
     * 基础查询
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
     * API Route Map
     */
    @GetMapping("/apiRouteMap")
    public ApiRouteMapResponse getApiRouteMap() {
        if (cachedGraph == null) {
            return ApiRouteMapResponse.builder().error("No index found, please index first").build();
        }

        List<GraphNode> controllerClasses = cachedGraph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName().contains("Controller"))
                .collect(Collectors.toList());

        List<ApiRoute> apiRoutes = new ArrayList<>();
        for (GraphNode controllerClass : controllerClasses) {
            List<GraphNode> methods = cachedGraph.getNodes().values().stream()
                    .filter(n -> "METHOD".equals(n.getType()) && controllerClass.getId().equals(n.getParentId()))
                    .collect(Collectors.toList());

            for (GraphNode method : methods) {
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
     * MCP 工具
     */
    @PostMapping("/mcp/query")
    public MCPQueryResponse mcpQuery(@RequestBody MCPQueryRequest request) {
        if (cachedGraph == null) {
            return MCPQueryResponse.builder().error("No index found, please index first").build();
        }

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

    private MCPQueryResponse findClass(String query) {
        List<GraphNode> classes = cachedGraph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(classes)
                .resultCount(classes.size())
                .build();
    }

    private MCPQueryResponse findMethod(String query) {
        List<GraphNode> methods = cachedGraph.getNodes().values().stream()
                .filter(n -> "METHOD".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(methods)
                .resultCount(methods.size())
                .build();
    }

    private MCPQueryResponse findField(String query) {
        List<GraphNode> fields = cachedGraph.getNodes().values().stream()
                .filter(n -> "FIELD".equals(n.getType()) && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(fields)
                .resultCount(fields.size())
                .build();
    }

    private MCPQueryResponse findUsage(String query) {
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
