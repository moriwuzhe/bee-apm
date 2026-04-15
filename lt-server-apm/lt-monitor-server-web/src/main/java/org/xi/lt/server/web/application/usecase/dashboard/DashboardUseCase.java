package org.xi.lt.server.web.application.usecase.dashboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.dashboard.DashboardStatResult;
import org.xi.lt.server.domain.model.dashboard.FromToCount;
import org.xi.lt.server.domain.model.graph.GraphData;
import org.xi.lt.server.domain.model.graph.GraphEdge;
import org.xi.lt.server.domain.model.graph.GraphNode;
import org.xi.lt.server.domain.repository.UnifiedDataStore;
import org.xi.lt.server.web.interfaces.http.api.dto.DashboardStatRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.DashboardTopologyRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardUseCase {
    @Autowired
    private UnifiedDataStore unifiedDataStore;

    public ApiResult<DashboardStatResult> stat(DashboardStatRequest req) {
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());
        String env = req == null ? "" : safe(req.getEnv());
        String app = req == null ? "" : safe(req.getApp());
        String ip = req == null ? "" : safe(req.getIp());

        DashboardStatResult result = new DashboardStatResult();
        result.setReq(unifiedDataStore.countByType(beginMs, endMs, env, app, ip, "req"));
        result.setLog(unifiedDataStore.countByType(beginMs, endMs, env, app, ip, "log"));
        result.setError(unifiedDataStore.countByType(beginMs, endMs, env, app, ip, "err"));
        result.setInst(unifiedDataStore.countDistinctInst(beginMs, endMs, env, app, ip));
        return ResultHelper.success(result);
    }

    public ApiResult<GraphData> globalTopology(DashboardTopologyRequest req) {
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());

        GraphData result = new GraphData();
        List<GraphNode> nodes = new ArrayList<>();
        List<GraphEdge> edges = new ArrayList<>();

        List<FromToCount> fromTo = unifiedDataStore.topologyFromTo(beginMs, endMs);
        java.util.Set<String> nodeSet = new java.util.HashSet<>();
        for (FromToCount e : fromTo) {
            String from = e == null ? null : e.getFrom();
            String to = e == null ? null : e.getTo();
            long times = e == null ? 0 : e.getTimes();
            if (from == null || from.isEmpty() || to == null || to.isEmpty()) continue;

            if (!nodeSet.contains(from)) {
                nodeSet.add(from);
                nodes.add(createNode(from));
            }
            if (!nodeSet.contains(to)) {
                nodeSet.add(to);
                nodes.add(createNode(to));
            }

            GraphEdge edge = new GraphEdge();
            edge.setFrom(from);
            edge.setTo(to);
            edge.setTimes(times);
            edge.setLabel(times + " requests");
            edges.add(edge);
        }

        result.setNodes(nodes);
        result.setEdges(edges);
        return ResultHelper.success(result);
    }

    private GraphNode createNode(String name) {
        GraphNode node = new GraphNode();
        node.setId(name);
        node.setLabel(name);

        String appSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'%3E%3Crect width='24' height='24' rx='4' fill='%23409EFF'/%3E%3Cpath d='M12 4L4 8l8 4 8-4-8-4zM4 16l8 4 8-4M4 12l8 4 8-4' fill='none' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E";
        String dbSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'%3E%3Crect width='24' height='24' rx='4' fill='%23E6A23C'/%3E%3Cpath d='M12 5C7.58 5 4 6.79 4 9s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm0 9c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z' fill='%23fff'/%3E%3C/svg%3E";

        String lower = name == null ? "" : name.toLowerCase();
        if (lower.contains("mysql") || lower.contains("db") || lower.contains("redis")) {
            node.setGroup("db");
            node.setImage(dbSvg);
        } else {
            node.setGroup("app");
            node.setImage(appSvg);
        }
        return node;
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }
}
