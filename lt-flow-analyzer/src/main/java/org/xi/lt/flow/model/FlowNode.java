package org.xi.lt.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 流程图节点
 * 表示一个类或方法
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlowNode {
    
    /**
     * 节点唯一标识
     */
    private String id;
    
    /**
     * 节点类型：CLASS, METHOD
     */
    private NodeType type;
    
    /**
     * 类名（全限定名）
     */
    private String className;
    
    /**
     * 方法名（如果是方法节点）
     */
    private String methodName;
    
    /**
     * 方法签名（如果是方法节点）
     */
    private String methodSignature;
    
    /**
     * 节点显示名称
     */
    private String displayName;
    
    /**
     * 子节点（被调用的方法）
     */
    @Builder.Default
    private List<FlowEdge> outgoingEdges = new ArrayList<>();
    
    /**
     * 父节点（调用此方法的方法）
     */
    @Builder.Default
    private List<FlowEdge> incomingEdges = new ArrayList<>();
    
    /**
     * 节点类型枚举
     */
    public enum NodeType {
        CLASS,
        METHOD
    }
    
    /**
     * 添加出边
     */
    public void addOutgoingEdge(FlowEdge edge) {
        if (outgoingEdges == null) {
            outgoingEdges = new ArrayList<>();
        }
        outgoingEdges.add(edge);
    }
    
    /**
     * 添加入边
     */
    public void addIncomingEdge(FlowEdge edge) {
        if (incomingEdges == null) {
            incomingEdges = new ArrayList<>();
        }
        incomingEdges.add(edge);
    }
    
    /**
     * 获取完整的节点标识
     */
    public String getFullId() {
        if (type == NodeType.METHOD) {
            return className + "#" + methodName;
        }
        return className;
    }
}
