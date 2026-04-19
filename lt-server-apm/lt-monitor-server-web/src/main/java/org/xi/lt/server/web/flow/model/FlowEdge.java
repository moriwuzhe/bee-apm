package org.xi.lt.server.web.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 流程图边
 * 表示方法调用关系
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlowEdge {
    
    /**
     * 边的唯一标识
     */
    private String id;
    
    /**
     * 源节点（调用方）
     */
    private FlowNode source;
    
    /**
     * 目标节点（被调用方）
     */
    private FlowNode target;
    
    /**
     * 调用类型：DIRECT, INDIRECT, CONDITIONAL, LOOP
     */
    private CallType callType;
    
    /**
     * 调用次数统计（如果有）
     */
    private int callCount;
    
    /**
     * 调用条件描述（如果是条件调用）
     */
    private String condition;
    
    /**
     * 调用类型枚举
     */
    public enum CallType {
        /**
         * 直接调用
         */
        DIRECT,
        
        /**
         * 间接调用（通过接口或抽象类）
         */
        INDIRECT,
        
        /**
         * 条件调用（if/switch）
         */
        CONDITIONAL,
        
        /**
         * 循环调用（for/while）
         */
        LOOP,
        
        /**
         * 递归调用
         */
        RECURSIVE
    }
    
    /**
     * 获取边的标识
     */
    public String getEdgeId() {
        if (source != null && target != null) {
            return source.getFullId() + " -> " + target.getFullId();
        }
        return id;
    }
}
