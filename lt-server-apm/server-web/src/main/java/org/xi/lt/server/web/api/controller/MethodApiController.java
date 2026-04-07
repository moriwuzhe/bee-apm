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

@RestController
public class MethodApiController {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private EsSearchService es;

    @PostMapping("/api/method/list")
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

        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", "proc"))
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (!env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
        if (!app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
        if (!gid.isEmpty()) q.must(QueryBuilders.termQuery("gid.keyword", gid));
        if (!ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));

        String sortField = "time";
        if ("spend".equals(sort)) sortField = "spend";

        try {
            EsSearchService.PageSearchResult r = es.searchPage("lt-process-*", q, sortField, SortOrder.DESC, (pageNum - 1) * PAGE_SIZE, PAGE_SIZE);
            return new PageResult<>(r.rows, pageNum, (int) r.total);
        } catch (Exception e) {
            return PageResult.empty(pageNum);
        }
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

