package org.xi.lt.server.web.infrastructure.es;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.web.domain.model.PageSearchResult;
import org.xi.lt.server.web.domain.model.query.SpanPageQuery;
import org.xi.lt.server.web.domain.model.span.SpanView;
import org.xi.lt.server.web.domain.repository.SpanQueryRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
public class EsSpanQueryRepository implements SpanQueryRepository {
    private static final String SPAN_INDEX = "lt_apm_span";

    @Autowired
    private EsSearchService es;

    @Autowired
    private EsClientHolder esClient;

    @Override
    public PageSearchResult<SpanView> searchPage(SpanPageQuery query) throws Exception {
        BoolQueryBuilder q = QueryBuilders.boolQuery();
        if (query != null) {
            String type = query.getType();
            if (type != null && !type.isEmpty()) {
                q.must(QueryBuilders.termQuery("type.keyword", type));
            }
            if (query.getBeginMs() > 0 && query.getEndMs() > 0) {
                q.must(QueryBuilders.rangeQuery("time").gte(query.getBeginMs()).lte(query.getEndMs()));
            }
            if (query.getEnv() != null && !query.getEnv().isEmpty()) q.must(QueryBuilders.termQuery("env.keyword", query.getEnv()));
            if (query.getApp() != null && !query.getApp().isEmpty()) q.must(QueryBuilders.termQuery("app.keyword", query.getApp()));
            if (query.getGid() != null && !query.getGid().isEmpty()) q.must(QueryBuilders.termQuery("gid.keyword", query.getGid()));
            if (query.getIp() != null && !query.getIp().isEmpty()) q.must(QueryBuilders.termQuery("ip.keyword", query.getIp()));

            if (query.getTagsRemoteLike() != null && !query.getTagsRemoteLike().isEmpty()) {
                q.must(QueryBuilders.wildcardQuery("tags.remote", "*" + query.getTagsRemoteLike() + "*"));
            }
            if (query.getTagsUrlLike() != null && !query.getTagsUrlLike().isEmpty()) {
                q.must(QueryBuilders.wildcardQuery("tags.url", "*" + query.getTagsUrlLike() + "*"));
            }
            if (query.getTagsLogLike() != null && !query.getTagsLogLike().isEmpty()) {
                q.must(QueryBuilders.wildcardQuery("tags.log", "*" + query.getTagsLogLike() + "*"));
            }

            Long minSpend = query.getMinSpend();
            Long maxSpend = query.getMaxSpend();
            if (minSpend != null && minSpend >= 0) q.must(QueryBuilders.rangeQuery("spend").gte(minSpend));
            if (maxSpend != null && maxSpend >= 0) q.must(QueryBuilders.rangeQuery("spend").lte(maxSpend));
        }

        String sortField = query == null ? null : query.getSortField();
        org.xi.lt.server.web.domain.model.SortDirection sortDirection = query == null ? org.xi.lt.server.web.domain.model.SortDirection.DESC : (query.getSortDirection() == null ? org.xi.lt.server.web.domain.model.SortDirection.DESC : query.getSortDirection());
        int from = query == null ? 0 : query.getFrom();
        int size = query == null ? 20 : query.getSize();
        return es.searchPage(SPAN_INDEX, q, sortField, sortDirection, from, size, SpanViewMapper::fromSource);
    }

    @Override
    public List<SpanView> searchByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception {
        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", type))
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (gid != null && !gid.isEmpty()) {
            q.must(QueryBuilders.termQuery("gid.keyword", gid));
        }
        return search(SPAN_INDEX, q, beginMs, endMs, max);
    }

    @Override
    public List<SpanView> searchByGidAny(String gid, long beginMs, long endMs, int max) throws Exception {
        BoolQueryBuilder q = QueryBuilders.boolQuery()
                .must(QueryBuilders.rangeQuery("time").gte(beginMs).lte(endMs));
        if (gid != null && !gid.isEmpty()) {
            q.must(QueryBuilders.termQuery("gid.keyword", gid));
        }
        return search(SPAN_INDEX, q, beginMs, endMs, max);
    }

    private List<SpanView> search(String indexPattern, BoolQueryBuilder query, long beginMs, long endMs, int max) throws Exception {
        SearchRequest sr = new SearchRequest(indexPattern);
        SearchSourceBuilder ssb = new SearchSourceBuilder();
        ssb.query(query);
        ssb.size(Math.min(10000, Math.max(1, max)));
        ssb.sort("time", SortOrder.ASC);
        sr.source(ssb);
        SearchResponse resp = esClient.getClient().search(sr);
        List<SpanView> out = new ArrayList<>();
        SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
        if (hits != null) {
            for (SearchHit h : hits) {
                out.add(SpanViewMapper.fromSource(h.getSourceAsMap()));
            }
        }
        return out;
    }
}
