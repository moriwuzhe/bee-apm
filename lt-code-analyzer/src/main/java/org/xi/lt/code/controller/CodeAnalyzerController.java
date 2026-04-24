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

import java.util.*;
import java.util.stream.Collectors;

/**
 * 代码分析器 REST API
 */
@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "*")
public class CodeAnalyzerController {

    private final JavaCodeIndexer indexer = new JavaCodeIndexer();

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
        try {
            cachedGraph = indexer.indexRepository(request.getRepoPath());
            return IndexResponse.builder()
                    .success(true)
                    .nodeCount(cachedGraph.getNodes().size())
                    .edgeCount(cachedGraph.getEdges().size())
                    .build();
        } catch (Exception e) {
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
}
