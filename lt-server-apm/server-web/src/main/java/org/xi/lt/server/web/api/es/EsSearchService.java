package org.xi.lt.server.web.api.es;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class EsSearchService {
    @Autowired
    private EsClientHolder es;

    public PageSearchResult searchPage(String indexPattern, BoolQueryBuilder query, String sortField, SortOrder order, int from, int size) throws Exception {
        SearchRequest sr = new SearchRequest(indexPattern);
        SearchSourceBuilder ssb = new SearchSourceBuilder();
        ssb.query(query);
        if (sortField != null && !sortField.isEmpty()) {
            ssb.sort(sortField, order == null ? SortOrder.DESC : order);
        }
        ssb.from(Math.max(0, from));
        ssb.size(Math.max(1, size));
        sr.source(ssb);
        SearchResponse resp = es.getClient().search(sr);
        long total = resp.getHits() == null ? 0 : resp.getHits().getTotalHits();
        List<Map<String, Object>> rows = new ArrayList<>();
        SearchHit[] hits = resp.getHits() == null ? null : resp.getHits().getHits();
        if (hits != null) {
            for (SearchHit h : hits) {
                rows.add(h.getSourceAsMap());
            }
        }
        return new PageSearchResult(total, rows);
    }

    public static final class PageSearchResult {
        public final long total;
        public final List<Map<String, Object>> rows;

        public PageSearchResult(long total, List<Map<String, Object>> rows) {
            this.total = total;
            this.rows = rows;
        }
    }
}

