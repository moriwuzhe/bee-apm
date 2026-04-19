package org.xi.lt.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 完整的流程图
 * 包含所有节点和边
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlowGraph {
    
    /**
     * 图的名称
     */
    private String name;
    
    /**
     * 图的描述
     */
    private String description;
    
    /**
     * 所有节点（按ID索引）
     */
    @Builder.Default
    private Map<String, FlowNode> nodes = new HashMap<>();
    
    /**
     * 所有边
     */
    @Builder.Default
    private List<FlowEdge> edges = new ArrayList<>();
    
    /**
     * 入口节点（起始点）
     */
    private FlowNode entryNode;
    
    /**
     * 添加节点
     */
    public void addNode(FlowNode node) {
        if (nodes == null) {
            nodes = new HashMap<>();
        }
        nodes.put(node.getFullId(), node);
    }
    
    /**
     * 获取节点
     */
    public FlowNode getNode(String nodeId) {
        if (nodes == null) {
            return null;
        }
        return nodes.get(nodeId);
    }
    
    /**
     * 添加边
     */
    public void addEdge(FlowEdge edge) {
        if (edges == null) {
            edges = new ArrayList<>();
        }
        edges.add(edge);
        
        // 同时更新节点的入边和出边
        if (edge.getSource() != null) {
            edge.getSource().addOutgoingEdge(edge);
        }
        if (edge.getTarget() != null) {
            edge.getTarget().addIncomingEdge(edge);
        }
    }
    
    /**
     * 获取所有节点列表
     */
    public List<FlowNode> getAllNodes() {
        if (nodes == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(nodes.values());
    }
    
    /**
     * 获取节点数量
     */
    public int getNodeCount() {
        if (nodes == null) {
            return 0;
        }
        return nodes.size();
    }
    
    /**
     * 获取边数量
     */
    public int getEdgeCount() {
        if (edges == null) {
            return 0;
        }
        return edges.size();
    }
    
    /**
     * 验证图的完整性
     */
    public boolean isValid() {
        if (nodes == null || nodes.isEmpty()) {
            return false;
        }
        
        // 检查所有边的源节点和目标节点都存在
        for (FlowEdge edge : edges) {
            if (edge.getSource() == null || !nodes.containsKey(edge.getSource().getFullId())) {
                return false;
            }
            if (edge.getTarget() == null || !nodes.containsKey(edge.getTarget().getFullId())) {
                return false;
            }
        }
        
        return true;
    }
}
