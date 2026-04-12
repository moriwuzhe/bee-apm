package org.xi.lt.server.web.infrastructure.es;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.web.domain.model.dashboard.FromToCount;
import org.xi.lt.server.web.domain.repository.DashboardQueryRepository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class EsDashboardQueryRepository implements DashboardQueryRepository {
    private static final String SPAN_INDEX = "lt_apm_span";

    @Autowired
    private EsClientHolder es;

    @Override
    public long countByType(long beginMs, long endMs, String env, String app, String ip, String type) {
        try {
            SearchRequest sr = new SearchRequest(SPAN_INDEX);
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("type.keyword", type))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            if (env != null && !env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
            if (app != null && !app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
            if (ip != null && !ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));
            ssb.query(q);
            ssb.size(0);
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            return resp.getHits() == null ? 0 : resp.getHits().getTotalHits();
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public long countDistinctInst(long beginMs, long endMs, String env, String app, String ip) {
        try {
            SearchRequest sr = new SearchRequest(SPAN_INDEX);
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("type.keyword", "hb"))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            if (env != null && !env.isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", env));
            if (app != null && !app.isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", app));
            if (ip != null && !ip.isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", ip));
            ssb.query(q);
            ssb.size(0);
            ssb.aggregation(AggregationBuilders.terms("inst").field("inst.keyword").size(1000));
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            Terms t = resp.getAggregations() == null ? null : resp.getAggregations().get("inst");
            return t == null ? 0 : t.getBuckets().size();
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public List<FromToCount> topologyFromTo(long beginMs, long endMs) {
        List<FromToCount> out = new ArrayList<>();
        try {
            SearchRequest sr = new SearchRequest(SPAN_INDEX);
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("type.keyword", "topo"))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            ssb.query(q);
            ssb.size(0);
            ssb.aggregation(AggregationBuilders.terms("from_to").field("tags.from_to.keyword").size(1000));
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            Terms t = resp.getAggregations() == null ? null : resp.getAggregations().get("from_to");
            if (t != null) {
                for (Terms.Bucket b : t.getBuckets()) {
                    String key = b.getKeyAsString();
                    if (key == null) continue;
                    String[] parts = key.split("->");
                    if (parts.length != 2) continue;
                    FromToCount x = new FromToCount();
                    x.setFrom(parts[0].trim());
                    x.setTo(parts[1].trim());
                    x.setTimes(b.getDocCount());
                    out.add(x);
                }
            }
            return out;
        } catch (Exception e) {
            return out;
        }
    }
}
