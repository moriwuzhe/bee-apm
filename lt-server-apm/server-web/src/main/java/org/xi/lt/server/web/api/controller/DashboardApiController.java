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

@RestController
public class DashboardApiController {
    @Autowired
    private EsClientHolder es;

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
        result.put("req", count("bee-request-*", "req", beginMs, endMs, env, app, ip));
        result.put("log", count("bee-logger-*", "log", beginMs, endMs, env, app, ip));
        result.put("error", count("bee-error-*", "err", beginMs, endMs, env, app, ip));
        result.put("inst", countDistinctInst(beginMs, endMs, env, app, ip));
        r.put("result", result);
        return r;
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
            SearchRequest sr = new SearchRequest("bee-heartbeat-*");
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

