package org.xi.lt.flow.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.xi.lt.flow.model.FlowEdge;

/**
 * 差异边信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffEdgeInfo {
    private String sourceId;
    private String targetId;
    private String sourceName;
    private String targetName;
    private String callType;
    private int callCount;

    public static DiffEdgeInfo from(FlowEdge edge) {
        if (edge == null) {
            return null;
        }
        return DiffEdgeInfo.builder()
                .sourceId(edge.getSource() != null ? edge.getSource().getId() : null)
                .targetId(edge.getTarget() != null ? edge.getTarget().getId() : null)
                .sourceName(edge.getSource() != null ? edge.getSource().getDisplayName() : null)
                .targetName(edge.getTarget() != null ? edge.getTarget().getDisplayName() : null)
                .callType(edge.getCallType() != null ? edge.getCallType().name() : null)
                .callCount(edge.getCallCount())
                .build();
    }
}
