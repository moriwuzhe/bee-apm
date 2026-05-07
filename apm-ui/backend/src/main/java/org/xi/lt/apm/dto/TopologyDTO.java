package org.xi.lt.apm.dto;

import java.util.List;

public class TopologyDTO {
    private List<TopologyNodeDTO> nodes;
    private List<TopologyEdgeDTO> edges;

    public TopologyDTO() {}

    public TopologyDTO(List<TopologyNodeDTO> nodes, List<TopologyEdgeDTO> edges) {
        this.nodes = nodes;
        this.edges = edges;
    }

    public List<TopologyNodeDTO> getNodes() { return nodes; }
    public void setNodes(List<TopologyNodeDTO> nodes) { this.nodes = nodes; }
    public List<TopologyEdgeDTO> getEdges() { return edges; }
    public void setEdges(List<TopologyEdgeDTO> edges) { this.edges = edges; }
}