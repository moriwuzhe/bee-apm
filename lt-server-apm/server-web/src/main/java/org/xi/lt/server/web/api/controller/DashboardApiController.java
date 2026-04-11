package org.xi.lt.server.web.api.controller;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.api.es.EsClientHolder;
import org.xi.lt.server.web.api.util.TimeParseUtils;

import java.util.HashMap;
import java.util.Map;

import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.xi.lt.server.web.api.es.EsSearchService;
import java.util.ArrayList;
import java.util.List;

@RestController
public class DashboardApiController {
    @Autowired
    private EsClientHolder es;
    
    @Autowired
    private EsSearchService esSearchService;

    @PostMapping("/api/dashboard/stat")
    public Map<String, Object> stat(@RequestBody Map<String, Object> req) {
        String beginTime = asString(req.get("beginTime"));
        String endTime = asString(req.get("endTime"));
        long beginMs = TimeParseUtils.parseMillis(beginTime);
        long endMs = TimeParseUtils.parseMillis(endTime);
        String env = asString(req.get("env"));
        String app = asString(req.get("app"));
        String ip = asString(req.get("ip"));

        Map<String, Object> r = new HashMap<>();
        r.put("code", "0");
        r.put("msg", "成功");
        Map<String, Object> result = new HashMap<>();
        result.put("req", count("lt-request-*", "req", beginMs, endMs, env, app, ip));
        result.put("log", count("lt-logger-*", "log", beginMs, endMs, env, app, ip));
        result.put("error", count("lt-error-*", "err", beginMs, endMs, env, app, ip));
        result.put("inst", countDistinctInst(beginMs, endMs, env, app, ip));
        r.put("result", result);
        return r;
    }

    @PostMapping("/api/dashboard/topology")
    public Map<String, Object> globalTopology(@RequestBody Map<String, Object> req) {
        long beginMs = TimeParseUtils.parseMillis(asString(req.get("beginTime")));
        long endMs = TimeParseUtils.parseMillis(asString(req.get("endTime")));
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();
        
        try {
            // Aggregate from lt-topology-*
            SearchRequest sr = new SearchRequest("lt-topology-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            
            ssb.query(q);
            ssb.size(0); // We only care about aggregations
            
            // Group by from_to (which stores caller->callee relationship)
            ssb.aggregation(AggregationBuilders.terms("from_to").field("tags.from_to.keyword").size(1000));
            sr.source(ssb);
            
            SearchResponse resp = es.getClient().search(sr);
            Terms fromToTerms = resp.getAggregations() == null ? null : resp.getAggregations().get("from_to");

            Map<String, String> nodeMap = new HashMap<>();
            if (fromToTerms != null) {
                for (Terms.Bucket bucket : fromToTerms.getBuckets()) {
                    String fromTo = bucket.getKeyAsString(); // format: callerInst|calleeInst or similar, let's parse it
                    long times = bucket.getDocCount();

                    // Simple split logic. Usually "caller_app -> callee_app" or similar
                    String[] parts = fromTo.split("->");
                    if (parts.length == 2) {
                        String from = parts[0].trim();
                        String to = parts[1].trim();
                        
                        if (!nodeMap.containsKey(from)) {
                            nodeMap.put(from, from);
                            nodes.add(createNode(from));
                        }
                        if (!nodeMap.containsKey(to)) {
                            nodeMap.put(to, to);
                            nodes.add(createNode(to));
                        }
                        
                        Map<String, Object> edge = new HashMap<>();
                        edge.put("from", from);
                        edge.put("to", to);
                        edge.put("times", times);
                        edge.put("label", times + " requests");
                        edges.add(edge);
                    }
                }
            }
        } catch (Exception e) {
            // log error
        }
        
        result.put("nodes", nodes);
        result.put("edges", edges);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", "0");
        response.put("result", result);
        return response;
    }
    
    private Map<String, Object> createNode(String name) {
        Map<String, Object> node = new HashMap<>();
        node.put("id", name);
        node.put("label", name);

        String appSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'%3E%3Crect width='24' height='24' rx='4' fill='%23409EFF'/%3E%3Cpath d='M12 4L4 8l8 4 8-4-8-4zM4 16l8 4 8-4M4 12l8 4 8-4' fill='none' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E";
        String dbSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'%3E%3Crect width='24' height='24' rx='4' fill='%23E6A23C'/%3E%3Cpath d='M12 5C7.58 5 4 6.79 4 9s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm0 9c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z' fill='%23fff'/%3E%3C/svg%3E";

        // Simple heuristic for styling
        if (name.toLowerCase().contains("mysql") || name.toLowerCase().contains("db") || name.toLowerCase().contains("redis")) {
            node.put("group", "db");
            node.put("image", dbSvg);
        } else {
            node.put("group", "app");
            node.put("image", appSvg);
        }
        return node;
    }

    private long count(String index, String type, long beginMs, long endMs, String env, String app, String ip) {
        try {
            SearchRequest sr = new SearchRequest(index);
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("type.keyword", type))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            if (!env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
            if (!app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
            if (!ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));
            ssb.query(q);
            ssb.size(0);
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            return resp.getHits() == null ? 0 : resp.getHits().getTotalHits();
        } catch (Exception e) {
            return 0;
        }
    }

    private long countDistinctInst(long beginMs, long endMs, String env, String app, String ip) {
        try {
            SearchRequest sr = new SearchRequest("lt-heartbeat-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("type.keyword", "hb"))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            if (!env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
            if (!app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
            if (!ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));
            ssb.query(q);
            ssb.size(0);
            ssb.aggregation(org.elasticsearch.search.aggregations.AggregationBuilders.terms("inst").field("inst.keyword").size(1000));
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            org.elasticsearch.search.aggregations.bucket.terms.Terms t = resp.getAggregations() == null ? null : resp.getAggregations().get("inst");
            return t == null ? 0 : t.getBuckets().size();
        } catch (Exception e) {
            return 0;
        }
    }

    private static String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
}

