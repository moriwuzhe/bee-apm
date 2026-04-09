package org.xi.lt.server.web.alert;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.diag.web.ApiResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alert")
public class AlertController {
    private static final Logger log = LoggerFactory.getLogger(AlertController.class);

    @Autowired(required = false)
    private RestHighLevelClient restHighLevelClient;

    @GetMapping("/list")
    public ApiResult<List<Map<String, Object>>> listAlerts(@RequestParam(required = false) String app,
                                                           @RequestParam(defaultValue = "100") int limit) {
        if (restHighLevelClient == null) {
            return ApiResult.fail("Elasticsearch client is not initialized");
        }

        try {
            SearchRequest searchRequest = new SearchRequest("lt_apm_alert");
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            if (app != null && !app.isEmpty()) {
                sourceBuilder.query(QueryBuilders.termQuery("app.keyword", app));
            } else {
                sourceBuilder.query(QueryBuilders.matchAllQuery());
            }
            
            sourceBuilder.sort("time", SortOrder.DESC);
            sourceBuilder.size(limit);
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);

            List<Map<String, Object>> result = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                result.add(hit.getSourceAsMap());
            }
            
            return ApiResult.ok(result);
        } catch (Exception e) {
            log.error("Failed to fetch alerts", e);
            return ApiResult.fail(e.getMessage());
        }
    }
}
