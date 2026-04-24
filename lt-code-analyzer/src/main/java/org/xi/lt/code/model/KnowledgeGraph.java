package org.xi.lt.code.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 知识图谱 - 包含所有节点和边
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeGraph {
    private String repoPath;     // 代码库路径
    private Map<String, GraphNode> nodes = new HashMap<>(); // 节点集合（ID -> Node）
    private List<GraphEdge> edges = new ArrayList<>(); // 边集合
    
    // 确保使用构建器时也能初始化默认值
    public static class KnowledgeGraphBuilder {
        private Map<String, GraphNode> nodes = new HashMap<>();
        private List<GraphEdge> edges = new ArrayList<>();
    }

    // 添加节点
    public void addNode(GraphNode node) {
        nodes.put(node.getId(), node);
    }

    // 添加边
    public void addEdge(GraphEdge edge) {
        edges.add(edge);
    }

    // 根据 ID 获取节点
    public GraphNode getNode(String nodeId) {
        return nodes.get(nodeId);
    }

    // 根据全限定名查找节点
    public GraphNode findNodeByQualifiedName(String qualifiedName) {
        return nodes.values().stream()
                .filter(n -> qualifiedName.equals(n.getQualifiedName()))
                .findFirst()
                .orElse(null);
    }
}
