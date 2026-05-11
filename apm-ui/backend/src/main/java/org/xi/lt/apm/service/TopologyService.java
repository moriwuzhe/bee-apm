package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.TopologyDTO;
import org.xi.lt.apm.dto.TopologyEdgeDTO;
import org.xi.lt.apm.dto.TopologyNodeDTO;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.TraceSpanRepository;

import java.util.*;

@Service
public class TopologyService {

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    public TopologyDTO getTopologyData() {
        List<TraceSpan> spans = traceSpanRepository.findRecent(java.time.LocalDateTime.now().minusHours(24));
        
        if (spans == null || spans.isEmpty()) {
            return new TopologyDTO(new ArrayList<>(), new ArrayList<>());
        }
        
        Map<String, TopologyNodeDTO> nodesMap = new HashMap<>();
        List<TopologyEdgeDTO> edges = new ArrayList<>();
        Set<String> processedEdges = new HashSet<>();
        
        for (TraceSpan span : spans) {
            String appName = span.getAppName();
            if (appName == null || appName.isEmpty()) continue;
            
            if (!nodesMap.containsKey(appName)) {
                nodesMap.put(appName, new TopologyNodeDTO(
                    appName, 
                    appName, 
                    380 + nodesMap.size() * 50, 
                    200, 
                    "service", 
                    "online"
                ));
            }
        }
        
        for (TraceSpan span : spans) {
            String from = span.getAppName();
            String to = span.getServiceName();
            
            if (from != null && !from.isEmpty() && to != null && !to.isEmpty() && !from.equals(to)) {
                String edgeKey = from + "->" + to;
                if (!processedEdges.contains(edgeKey)) {
                    processedEdges.add(edgeKey);
                    
                    TopologyEdgeDTO edge = new TopologyEdgeDTO();
                    edge.setFrom(from);
                    edge.setTo(to);
                    edge.setLatency(span.getDuration() != null ? span.getDuration() + "ms" : "0ms");
                    edge.setWarn(span.getDuration() != null && span.getDuration() > 100);
                    edge.setEdgeType("sync");
                    edges.add(edge);
                }
            }
        }
        
        return new TopologyDTO(new ArrayList<>(nodesMap.values()), edges);
    }
}