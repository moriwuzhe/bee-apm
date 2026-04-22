package org.xi.lt.flow.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 差异分析结果响应对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffResultResponse {
    private boolean success;
    private String message;
    private String oldGraphId;
    private String newGraphId;
    private boolean hasChanges;
    private int totalChanges;
    private List<DiffNodeInfo> addedNodes;
    private List<DiffNodeInfo> removedNodes;
    private List<DiffNodeInfo> unchangedNodes;
    private List<DiffEdgeInfo> addedEdges;
    private List<DiffEdgeInfo> removedEdges;
    private List<DiffEdgeInfo> unchangedEdges;
    private DiffStats stats;
    private String highlightedPlantUmlContent;
    private String highlightedPreviewImage;

    public static DiffResultResponse empty() {
        return DiffResultResponse.builder()
                .success(true)
                .hasChanges(false)
                .totalChanges(0)
                .addedNodes(new ArrayList<>())
                .removedNodes(new ArrayList<>())
                .unchangedNodes(new ArrayList<>())
                .addedEdges(new ArrayList<>())
                .removedEdges(new ArrayList<>())
                .unchangedEdges(new ArrayList<>())
                .stats(DiffStats.builder().build())
                .build();
    }

    public static DiffResultResponse error(String message) {
        return DiffResultResponse.builder()
                .success(false)
                .message(message)
                .hasChanges(false)
                .totalChanges(0)
                .addedNodes(new ArrayList<>())
                .removedNodes(new ArrayList<>())
                .unchangedNodes(new ArrayList<>())
                .addedEdges(new ArrayList<>())
                .removedEdges(new ArrayList<>())
                .unchangedEdges(new ArrayList<>())
                .stats(DiffStats.builder().build())
                .build();
    }
}
