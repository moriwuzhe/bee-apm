package org.xi.lt.code.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.xi.lt.code.model.FlowNode;

/**
 * 差异节点信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffNodeInfo {
    private String id;
    private String type;
    private String className;
    private String methodName;
    private String displayName;

    public static DiffNodeInfo from(FlowNode node) {
        if (node == null) {
            return null;
        }
        return DiffNodeInfo.builder()
                .id(node.getId())
                .type(node.getType() != null ? node.getType().name() : "UNKNOWN")
                .className(node.getClassName())
                .methodName(node.getMethodName())
                .displayName(node.getDisplayName())
                .build();
    }
}
