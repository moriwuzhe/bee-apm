package org.xi.lt.server.web.infrastructure.diag.netty;

import io.netty.channel.Channel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AgentConnectionStore {
    private final ConcurrentHashMap<String, AgentConnection> connections = new ConcurrentHashMap<>();

    public void register(String agentId, int version, Channel channel) {
        connections.put(agentId, new AgentConnection(agentId, version, channel));
    }

    public AgentConnection get(String agentId) {
        if (agentId == null) return null;
        return connections.get(agentId);
    }

    public void remove(Channel channel) {
        if (channel == null) return;
        for (Map.Entry<String, AgentConnection> e : connections.entrySet()) {
            AgentConnection c = e.getValue();
            if (c != null && c.getChannel() == channel) {
                connections.remove(e.getKey(), c);
            }
        }
    }

    public List<AgentConnection> list() {
        return connections.values().stream().collect(Collectors.toList());
    }

    public List<AgentConnection> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return list();
        }
        String k = keyword.trim();
        return connections.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getKey().contains(k))
                .map(Map.Entry::getValue)
                .collect(Collectors.toList());
    }
}
