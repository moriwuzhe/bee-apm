package org.xi.lt.server.domain.model.graph;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GraphData {
    private List<GraphNode> nodes = new ArrayList<>();
    private List<GraphEdge> edges = new ArrayList<>();

    public List<GraphNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<GraphNode> nodes) {
        this.nodes = nodes == null ? new ArrayList<>() : nodes;
    }

    public List<GraphEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<GraphEdge> edges) {
        this.edges = edges == null ? new ArrayList<>() : edges;
    }
}
