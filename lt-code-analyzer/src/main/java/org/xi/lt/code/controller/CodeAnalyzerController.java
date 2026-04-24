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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
}
