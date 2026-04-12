package org.xi.lt.server.web.infrastructure.es;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.web.domain.model.common.KeyValue;
import org.xi.lt.server.web.domain.repository.CommonQueryRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
public class EsCommonQueryRepository implements CommonQueryRepository {
    @Autowired
    private EsClientHolder es;

    @Override
    public List<KeyValue> groupList(long beginMs, long endMs, String groupField) {
        try {
            SearchRequest sr = new SearchRequest("lt-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            ssb.query(q);
            ssb.size(0);
            ssb.aggregation(AggregationBuilders.terms("g").field(groupField + ".keyword").size(200));
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            Terms t = resp.getAggregations() == null ? null : resp.getAggregations().get("g");
            List<KeyValue> out = new ArrayList<>();
            if (t != null) {
                for (Terms.Bucket b : t.getBuckets()) {
                    out.add(new KeyValue(b.getKeyAsString(), b.getKeyAsString()));
                }
            }
            return out;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public Object queryById(String indexPrefix, String id, long beginMs, long endMs) {
        if (id == null || id.isEmpty() || indexPrefix == null || indexPrefix.isEmpty()) return null;
        try {
            SearchRequest sr = new SearchRequest(indexPrefix + "-*");
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder q = QueryBuilders.boolQuery()
                    .must(QueryBuilders.termQuery("id.keyword", id))
                    .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
            ssb.query(q);
            ssb.size(1);
            sr.source(ssb);
            SearchResponse resp = es.getClient().search(sr);
            SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
            if (hits == null || hits.length == 0) return null;
            return hits[0].getSourceAsMap();
        } catch (Exception e) {
            return null;
        }
    }
}
