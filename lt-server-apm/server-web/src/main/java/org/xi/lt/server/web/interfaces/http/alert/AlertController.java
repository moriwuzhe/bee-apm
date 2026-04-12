package org.xi.lt.server.web.interfaces.http.alert;

import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
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
import org.xi.lt.server.web.domain.model.alert.AlertRow;
import org.xi.lt.server.web.infrastructure.es.EsClientHolder;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;
import org.xi.lt.server.web.shared.util.ObjectFieldUtils;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/alert")
public class AlertController {
    private static final Logger log = LoggerFactory.getLogger(AlertController.class);

    @Autowired
    private EsClientHolder esClientHolder;

    @GetMapping("/list")
    public ApiResult<List<AlertRow>> listAlerts(@RequestParam(required = false) String app,
                                                           @RequestParam(defaultValue = "100") int limit) {
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
            SearchResponse response = esClientHolder.getClient().search(searchRequest);

            List<AlertRow> result = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                result.add(toRow(hit.getSourceAsMap()));
            }
            
            return ResultHelper.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch alerts", e);
            return ResultHelper.fail(e.getMessage());
        }
    }

    private static AlertRow toRow(Object obj) {
        AlertRow r = new AlertRow();
        r.setId(ObjectFieldUtils.getString(obj, "id"));
        r.setTime(ObjectFieldUtils.getLong(obj, "time"));
        r.setApp(ObjectFieldUtils.getString(obj, "app"));
        r.setUrl(ObjectFieldUtils.getString(obj, "url"));
        r.setGid(ObjectFieldUtils.getString(obj, "gid"));
        r.setAlertType(ObjectFieldUtils.getString(obj, "alertType"));
        r.setMessage(ObjectFieldUtils.getString(obj, "message"));
        r.setStatus(ObjectFieldUtils.getString(obj, "status"));
        return r;
    }
}
