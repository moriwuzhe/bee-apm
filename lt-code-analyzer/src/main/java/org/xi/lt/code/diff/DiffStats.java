package org.xi.lt.code.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 差异统计信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffStats {
    private int oldNodeCount;
    private int newNodeCount;
    private int oldEdgeCount;
    private int newEdgeCount;
    private int nodeDiff;
    private int edgeDiff;
}
