package org.xi.lt.server.domain.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TopologyGraph {
    private List<TopologyNode> nodes = new ArrayList<>();
    private List<TopologyEdge> edges = new ArrayList<>();

    public List<TopologyNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<TopologyNode> nodes) {
        this.nodes = nodes == null ? new ArrayList<>() : nodes;
    }

    public List<TopologyEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<TopologyEdge> edges) {
        this.edges = edges == null ? new ArrayList<>() : edges;
    }
}
