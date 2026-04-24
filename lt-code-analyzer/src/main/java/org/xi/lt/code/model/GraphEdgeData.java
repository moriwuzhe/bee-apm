package org.xi.lt.code.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图边数据（用于前端交互）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphEdgeData {
    private String sourceId;
    private String targetId;
    private String source;  // ECharts 需要
    private String target;  // ECharts 需要
    private String callType;
    private int callCount;

    public static GraphEdgeData from(FlowEdge edge) {
        if (edge == null) {
            return null;
        }
        String sourceId = edge.getSource() != null ? edge.getSource().getId() : null;
        String targetId = edge.getTarget() != null ? edge.getTarget().getId() : null;
        return GraphEdgeData.builder()
                .sourceId(sourceId)
                .targetId(targetId)
                .source(sourceId)
                .target(targetId)
                .callType(edge.getCallType() != null ? edge.getCallType().name() : null)
                .callCount(edge.getCallCount())
                .build();
    }
}
