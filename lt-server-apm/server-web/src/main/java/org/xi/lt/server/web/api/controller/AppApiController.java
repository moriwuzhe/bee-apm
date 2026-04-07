package org.xi.lt.server.web.api.controller;

import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.api.es.EsSearchService;
import org.xi.lt.server.web.api.model.PageResult;
import org.xi.lt.server.web.api.util.TimeParseUtils;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;

@RestController
public class AppApiController {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private EsSearchService es;

    @PostMapping("/api/app/info/list")
    public PageResult<Map<String, Object>> list(@RequestBody Map<String, Object> req) {
        int pageNum = asInt(req.get("pageNum"), 1);
        String env = asString(req.get("env"));
        String app = asString(req.get("app"));
        String ip = asString(req.get("ip"));

        List<Map<String, Object>> allInstances = new ArrayList<>();
        Map<String, Object> agentData = new AgentControlController().getInstances();
        List<AgentControlController.AgentInstanceInfo> infos = (List<AgentControlController.AgentInstanceInfo>) agentData.get("data");
        
        if (infos != null) {
            for (AgentControlController.AgentInstanceInfo info : infos) {
                // Apply filters
                if (!app.isEmpty() && !app.equals(info.getApp())) continue;
                if (!ip.isEmpty() && !ip.equals(info.getIp())) continue;
                // Currently env is not in AgentInstanceInfo, we can add it or skip
                
                Map<String, Object> row = new HashMap<>();
                row.put("app", info.getApp());
                row.put("inst", info.getInst());
                row.put("ip", info.getIp());
                row.put("env", "default"); // Mock env or fetch from info if added
                row.put("time", TimeParseUtils.formatMillis(info.getLastHeartbeatTime()));
                
                Map<String, String> tags = new HashMap<>();
                tags.put("version", info.getVersion());
                row.put("tags", tags);
                row.put("online", info.isOnline());
                
                allInstances.add(row);
            }
        }
        
        // simple pagination
        int start = (pageNum - 1) * PAGE_SIZE;
        int end = Math.min(start + PAGE_SIZE, allInstances.size());
        List<Map<String, Object>> paged = start >= allInstances.size() ? new ArrayList<>() : allInstances.subList(start, end);
        
        return new PageResult<>(paged, pageNum, allInstances.size());
    }

    private static String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static int asInt(Object o, int def) {
        if (o == null) return def;
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }
}

