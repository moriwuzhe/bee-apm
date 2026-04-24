package org.xi.lt.code.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 图节点数据（用于前端交互）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphNodeData {
    private String id;
    private String type;
    private String className;
    private String methodName;
    private String displayName;
    private String methodSignature;
    private Map<String, Object> metadata;

    public static GraphNodeData from(FlowNode node) {
        if (node == null) {
            return null;
        }
        return GraphNodeData.builder()
                .id(node.getId())
                .type(node.getType() != null ? node.getType().name() : "UNKNOWN")
                .className(node.getClassName())
                .methodName(node.getMethodName())
                .displayName(node.getDisplayName())
                .methodSignature(node.getMethodSignature())
                .metadata(node.getMetadata())
                .build();
    }
}
