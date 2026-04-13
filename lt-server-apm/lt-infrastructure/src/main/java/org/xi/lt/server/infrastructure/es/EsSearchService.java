package org.xi.lt.server.infrastructure.es;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.PageSearchResult;
import org.xi.lt.server.domain.model.SortDirection;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

@Service
public class EsSearchService {
    @Autowired
    private EsClientHolder es;

    public <T> PageSearchResult<T> searchPage(String indexPattern, BoolQueryBuilder query, String sortField, SortDirection direction, int from, int size, Function<Object, T> mapper) throws Exception {
        SearchRequest sr = new SearchRequest(indexPattern);
        SearchSourceBuilder ssb = new SearchSourceBuilder();
        ssb.query(query);
        if (sortField != null && !sortField.isEmpty()) {
            SortOrder order = direction == SortDirection.ASC ? SortOrder.ASC : SortOrder.DESC;
            ssb.sort(sortField, order);
        }
        ssb.from(Math.max(0, from));
        ssb.size(Math.max(1, size));
        sr.source(ssb);
        SearchResponse resp = es.getClient().search(sr);
        long total = resp.getHits() == null ? 0 : resp.getHits().getTotalHits();
        List<T> rows = new ArrayList<>();
        SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
        if (hits != null) {
            for (SearchHit h : hits) {
                Object src = h.getSourceAsMap();
                rows.add(mapper == null ? (T) src : mapper.apply(src));
            }
        }
        return new PageSearchResult(total, rows);
    }
}

