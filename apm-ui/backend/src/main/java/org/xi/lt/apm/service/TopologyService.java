package org.xi.lt.apm.service;

import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.TopologyDTO;
import org.xi.lt.apm.dto.TopologyEdgeDTO;
import org.xi.lt.apm.dto.TopologyNodeDTO;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TopologyService {

    public TopologyDTO getTopologyData() {
        List<TopologyNodeDTO> nodes = Arrays.asList(
            new TopologyNodeDTO("lb", "负载均衡", 380, 60, "gateway", "online"),
            new TopologyNodeDTO("api-gw", "API网关", 380, 160, "gateway", "online"),
            new TopologyNodeDTO("order", "订单服务", 130, 290, "service", "error"),
            new TopologyNodeDTO("pay", "支付服务", 310, 290, "service", "online"),
            new TopologyNodeDTO("user", "用户服务", 490, 290, "service", "warning"),
            new TopologyNodeDTO("inventory", "库存服务", 670, 290, "service", "online"),
            new TopologyNodeDTO("mq", "消息队列", 130, 430, "infra", "online"),
            new TopologyNodeDTO("db-order", "订单DB", 310, 430, "infra", "online"),
            new TopologyNodeDTO("db-user", "用户DB", 490, 430, "infra", "online"),
            new TopologyNodeDTO("redis", "Redis集群", 670, 430, "infra", "warning"),
            new TopologyNodeDTO("es", "Elasticsearch", 850, 290, "infra", "online"),
            new TopologyNodeDTO("notify", "通知服务", 850, 430, "service", "online")
        );

        List<TopologyEdgeDTO> syncEdges = Arrays.asList(
            createSyncEdge("lb", "api-gw", "2ms", false, 1240),
            createSyncEdge("api-gw", "order", "12ms", false, 320),
            createSyncEdge("api-gw", "pay", "8ms", false, 180),
            createSyncEdge("api-gw", "user", "156ms", true, 560),
            createSyncEdge("api-gw", "inventory", "5ms", false, 215),
            createSyncEdge("order", "db-order", "45ms", true, 98),
            createSyncEdge("pay", "db-order", "18ms", false, 76),
            createSyncEdge("user", "db-user", "22ms", false, 143),
            createSyncEdge("inventory", "redis", "2ms", false, 432),
            createSyncEdge("inventory", "es", "8ms", false, 67),
            createSyncEdge("user", "redis", "3ms", false, 288)
        );

        List<TopologyEdgeDTO> asyncEdges = Arrays.asList(
            createAsyncEdge("order", "mq", "3ms", "order.created", false),
            createAsyncEdge("mq", "pay", "12ms", "order.created", false),
            createAsyncEdge("mq", "inventory", "8ms", "order.created", false),
            createAsyncEdge("mq", "notify", "5ms", "order.paid", false),
            createAsyncEdge("pay", "mq", "4ms", "payment.done", true),
            createAsyncEdge("inventory", "mq", "6ms", "stock.deducted", false),
            createAsyncEdge("notify", "es", "9ms", "notify.log", false)
        );

        List<TopologyEdgeDTO> edges = syncEdges.stream()
            .peek(e -> e.setEdgeType("sync"))
            .collect(Collectors.toList());
        edges.addAll(asyncEdges.stream()
            .peek(e -> e.setEdgeType("async"))
            .collect(Collectors.toList()));

        return new TopologyDTO(nodes, edges);
    }

    private TopologyEdgeDTO createSyncEdge(String from, String to, String latency, boolean warn, int qps) {
        TopologyEdgeDTO edge = new TopologyEdgeDTO();
        edge.setFrom(from);
        edge.setTo(to);
        edge.setLatency(latency);
        edge.setWarn(warn);
        edge.setQps(qps);
        return edge;
    }

    private TopologyEdgeDTO createAsyncEdge(String from, String to, String latency, String topic, boolean warn) {
        TopologyEdgeDTO edge = new TopologyEdgeDTO();
        edge.setFrom(from);
        edge.setTo(to);
        edge.setLatency(latency);
        edge.setTopic(topic);
        edge.setWarn(warn);
        return edge;
    }
}