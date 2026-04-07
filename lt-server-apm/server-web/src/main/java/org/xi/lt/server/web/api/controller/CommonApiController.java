package org.xi.lt.server.web.api.controller;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.api.es.EsClientHolder;
import org.xi.lt.server.web.api.util.TimeParseUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class CommonApiController {
    @Autowired
    private EsClientHolder es;

    @PostMapping("/api/common/getGroupList")
    public Map<String, Object> getGroupList(@RequestBody Map<String, Object> req) {
        String beginTime = asString(req.get("beginTime"));
        String endTime = asString(req.get("endTime"));
        long beginMs = TimeParseUtils.parseMillis(beginTime);
        long endMs = TimeParseUtils.parseMillis(endTime);
        String group = asString(req.get("group"));
        String field = "env";
        if ("app".equals(group)) field = "app";
        if (!"env".equals(field) && !"app".equals(field)) field = "env";

        try {
            SearchRequest sr = new SearchRequest("lt-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            ssb.query(q);
            ssb.size(0);
            ssb.aggregation(AggregationBuilders.terms("g").field(field + ".keyword").size(200));
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            Terms t = resp.getAggregations() == null ? null : resp.getAggregations().get("g");
            List<Map<String, String>> out = new ArrayList<>();
            if (t != null) {
                for (Terms.Bucket b : t.getBuckets()) {
                    Map<String, String> kv = new HashMap<>();
                    kv.put("name", b.getKeyAsString());
                    kv.put("value", b.getKeyAsString());
                    out.add(kv);
                }
            }
            Map<String, Object> r = new HashMap<>();
            r.put("code", "0");
            r.put("msg", "成功");
            r.put("result", out);
            return r;
        } catch (Exception e) {
            Map<String, Object> r = new HashMap<>();
            r.put("code", "1");
            r.put("msg", e.getMessage());
            r.put("result", new ArrayList<>());
            return r;
        }
    }

    @PostMapping("/api/common/queryById")
    public Map<String, Object> queryById(@RequestBody Map<String, Object> req) {
        String id = asString(req.get("id"));
        String index = asString(req.get("index"));
        String beginTime = asString(req.get("beginTime"));
        String endTime = asString(req.get("endTime"));
        long beginMs = TimeParseUtils.parseMillis(beginTime);
        long endMs = TimeParseUtils.parseMillis(endTime);
        if (id.isEmpty() || index.isEmpty()) return wrapResult(null);

        try {
            SearchRequest sr = new SearchRequest(index + "-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("id.keyword", id))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            ssb.query(q);
            ssb.size(1);
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
            if (hits == null || hits.length == 0) return wrapResult(null);
            return wrapResult(hits[0].getSourceAsMap());
        } catch (Exception e) {
            return wrapError(e.getMessage());
        }
    }

    private static Map<String, Object> wrapResult(Object obj) {
        Map<String, Object> r = new HashMap<>();
        r.put("code", "0");
        r.put("msg", "成功");
        r.put("result", obj);
        return r;
    }

    private static Map<String, Object> wrapError(String msg) {
        Map<String, Object> r = new HashMap<>();
        r.put("code", "1");
        r.put("msg", msg);
        r.put("result", null);
        return r;
    }

    private static String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
}

