package org.xi.lt.server.web.api.controller;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.api.es.EsClientHolder;
import org.xi.lt.server.web.api.es.EsSearchService;
import org.xi.lt.server.web.api.model.PageResult;
import org.xi.lt.server.web.api.util.TimeParseUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class RequestApiController {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private EsSearchService es;

    @Autowired
    private EsClientHolder esClient;

    @PostMapping("/api/request/list")
    public PageResult<Map<String, Object>> list(@RequestBody Map<String, Object> req) {
        int pageNum = asInt(req.get("pageNum"), 1);
        String beginTime = asString(req.get("beginTime"));
        String endTime = asString(req.get("endTime"));
        long beginMs = TimeParseUtils.parseMillis(beginTime);
        long endMs = TimeParseUtils.parseMillis(endTime);
        String env = asString(req.get("env"));
        String app = asString(req.get("app"));
        String sort = asString(req.get("sort"));
        String gid = asString(req.get("gid"));
        String ip = asString(req.get("ip"));
        String url = asString(req.get("url"));
        String remote = asString(req.get("remote"));
        long minSpend = asLong(req.get("minSpend"), -1);
        long maxSpend = asLong(req.get("maxSpend"), -1);

        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", "req"))
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (!env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
        if (!app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
        if (!gid.isEmpty()) q.must(QueryBuilders.termQuery("gid.keyword", gid));
        if (!ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));
        if (!remote.isEmpty()) q.must(QueryBuilders.wildcardQuery("tags.remote", "*" + remote + "*"));
        if (!url.isEmpty()) q.must(QueryBuilders.wildcardQuery("tags.url", "*" + url + "*"));
        if (minSpend >= 0) q.must(QueryBuilders.rangeQuery("spend").gte(minSpend));
        if (maxSpend >= 0) q.must(QueryBuilders.rangeQuery("spend").lte(maxSpend));

        String sortField = "time";
        if ("spend".equals(sort)) sortField = "spend";

        try {
            EsSearchService.PageSearchResult r = es.searchPage("lt-request-*", q, sortField, SortOrder.DESC, (pageNum - 1) * PAGE_SIZE, PAGE_SIZE);
            return new PageResult<>(r.rows, pageNum, (int) r.total);
        } catch (Exception e) {
            return PageResult.empty(pageNum);
        }
    }

    @PostMapping("/api/request/callTree")
    public Map<String, Object> callTree(@RequestBody Map<String, Object> req) {
        String gid = asString(req.get("gid"));
        String time = asString(req.get("time"));
        try {
            long t = parseMillis(time);
            long begin = t - 30 * 60 * 1000L;
            long end = t + 30 * 60 * 1000L;
            Map<String, Object> tree = buildCallTree(gid, begin, end);
            return wrapResult(tree);
        } catch (Exception e) {
            return wrapResult(new HashMap<>());
        }
    }

    @PostMapping("/api/request/topology")
    public Map<String, Object> topology(@RequestBody Map<String, Object> req) {
        String gid = asString(req.get("gid"));
        String time = asString(req.get("time"));
        try {
            long t = parseMillis(time);
            long begin = t - 30 * 60 * 1000L;
            long end = t + 30 * 60 * 1000L;
            Map<String, Object> topo = buildTopology(gid, begin, end);
            return wrapResult(topo);
        } catch (Exception e) {
            return wrapResult(new HashMap<>());
        }
    }

    private Map<String, Object> buildCallTree(String gid, long beginMs, long endMs) throws Exception {
        List<Map<String, Object>> reqs = searchByGid("lt-request-*", "req", gid, beginMs, endMs, 2000);
        if (reqs.isEmpty()) return new HashMap<>();
        Map<String, Object> rootSpan = reqs.get(0);
        Map<String, Object> root = new HashMap<>();
        root.put("type", "req");
        root.put("app", asString(rootSpan.get("app")));
        root.put("spend", rootSpan.get("spend"));
        Map<String, Object> tags = asMap(rootSpan.get("tags"));
        root.put("text", asString(tags.get("method")) + " " + asString(tags.get("url")));
        root.put("children", new ArrayList<>());

        String rootId = asString(rootSpan.get("id"));
        List<Map<String, Object>> procs = searchByPid("lt-process-*", "proc", gid, rootId, beginMs, endMs, 5000);
        List<Map<String, Object>> children = (List<Map<String, Object>>) root.get("children");
        for (Map<String, Object> p : procs) {
            Map<String, Object> node = new HashMap<>();
            node.put("type", "proc");
            node.put("app", asString(p.get("app")));
            node.put("spend", p.get("spend"));
            Map<String, Object> pt = asMap(p.get("tags"));
            node.put("text", asString(pt.get("method")));
            node.put("children", new ArrayList<>());
            children.add(node);

            String pid = asString(p.get("id"));
            List<Map<String, Object>> sqls = searchByPid("lt-sql-*", "sql", gid, pid, beginMs, endMs, 5000);
            List<Map<String, Object>> c2 = (List<Map<String, Object>>) node.get("children");
            for (Map<String, Object> s : sqls) {
                Map<String, Object> n2 = new HashMap<>();
                n2.put("type", "sql");
                n2.put("app", asString(s.get("app")));
                n2.put("spend", s.get("spend"));
                Map<String, Object> st = asMap(s.get("tags"));
                n2.put("text", asString(st.get("sql")));
                n2.put("children", new ArrayList<>());
                c2.add(n2);
            }
        }
        return root;
    }

    private Map<String, Object> buildTopology(String gid, long beginMs, long endMs) throws Exception {
        List<Map<String, Object>> reqs = searchByGid("lt-request-*", "req", gid, beginMs, endMs, 2000);
        if (reqs.isEmpty()) return new HashMap<>();
        Map<String, Object> r = reqs.get(0);
        String app = asString(r.get("app"));
        String inst = asString(r.get("inst"));
        String srcApp = asString(asMap(r.get("tags")).get("srcApp"));
        String srcInst = asString(asMap(r.get("tags")).get("srcInst"));

        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();
        if (!srcApp.isEmpty()) {
            nodes.add(node(srcApp, srcInst));
        }
        nodes.add(node(app, inst));
        if (!srcApp.isEmpty()) {
            edges.add(edge(srcApp + "@" + srcInst, app + "@" + inst));
        }
        Map<String, Object> out = new HashMap<>();
        out.put("nodes", nodes);
        out.put("edges", edges);
        return out;
    }

    private Map<String, Object> node(String app, String inst) {
        Map<String, Object> n = new HashMap<>();
        n.put("id", app + "@" + inst);
        n.put("app", app);
        n.put("inst", inst);
        return n;
    }

    private Map<String, Object> edge(String source, String target) {
        Map<String, Object> e = new HashMap<>();
        e.put("source", source);
        e.put("target", target);
        return e;
    }

    private List<Map<String, Object>> searchByGid(String indexPattern, String type, String gid, long beginMs, long endMs, int max) throws Exception {
        SearchRequest sr = new SearchRequest(indexPattern);
        SearchSourceBuilder ssb = new SearchSourceBuilder();
        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", type))
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (!gid.isEmpty()) q.must(QueryBuilders.termQuery("gid.keyword", gid));
        ssb.query(q);
        ssb.size(Math.min(10000, Math.max(1, max)));
        ssb.sort("time", SortOrder.ASC);
        sr.source(ssb);
        SearchResponse resp = esClient.getClient().search(sr);
        List<Map<String, Object>> out = new ArrayList<>();
        SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
        if (hits != null) {
            for (SearchHit h : hits) {
                out.add(h.getSourceAsMap());
            }
        }
        return out;
    }

    private List<Map<String, Object>> searchByPid(String indexPattern, String type, String gid, String pid, long beginMs, long endMs, int max) throws Exception {
        SearchRequest sr = new SearchRequest(indexPattern);
        SearchSourceBuilder ssb = new SearchSourceBuilder();
        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", type))
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (!gid.isEmpty()) q.must(QueryBuilders.termQuery("gid.keyword", gid));
        if (!pid.isEmpty()) q.must(QueryBuilders.termQuery("pid.keyword", pid));
        ssb.query(q);
        ssb.size(Math.min(10000, Math.max(1, max)));
        ssb.sort("time", SortOrder.ASC);
        sr.source(ssb);
        SearchResponse resp = esClient.getClient().search(sr);
        List<Map<String, Object>> out = new ArrayList<>();
        SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
        if (hits != null) {
            for (SearchHit h : hits) {
                out.add(h.getSourceAsMap());
            }
        }
        return out;
    }

    private static Map<String, Object> wrapResult(Object obj) {
        Map<String, Object> r = new HashMap<>();
        r.put("code", "0");
        r.put("msg", "成功");
        r.put("result", obj);
        return r;
    }

    private static Map<String, Object> asMap(Object o) {
        if (o instanceof Map) return (Map<String, Object>) o;
        return new HashMap<>();
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

    private static long asLong(Object o, long def) {
        if (o == null) return def;
        try {
            return Long.parseLong(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }

    private static long parseMillis(String time) {
        return TimeParseUtils.parseMillis(time);
    }
}

