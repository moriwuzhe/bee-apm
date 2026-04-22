package org.xi.lt.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 图数据（用于前端交互）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphData {
    @Builder.Default
    private List<GraphNodeData> nodes = new ArrayList<>();

    @Builder.Default
    private List<GraphEdgeData> edges = new ArrayList<>();

    public static GraphData from(FlowGraph graph) {
        if (graph == null) {
            return GraphData.builder().build();
        }
        return GraphData.builder()
                .nodes(graph.getAllNodes().stream()
                        .map(GraphNodeData::from)
                        .collect(Collectors.toList()))
                .edges(graph.getEdges().stream()
                        .map(GraphEdgeData::from)
                        .collect(Collectors.toList()))
                .build();
    }
}
