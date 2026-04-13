package org.xi.lt.server.web.application.alert;

import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.SearchHit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.xi.lt.server.infrastructure.es.EsClientHolder;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@EnableScheduling
public class AlertEngineService {
    private static final Logger log = LoggerFactory.getLogger(AlertEngineService.class);

    @Autowired
    private EsClientHolder esClientHolder;

    // 每分钟执行一次告警规则评估
    @Scheduled(cron = "0 * * * * ?")
    public void evaluateRules() {
        log.info("Starting intelligent alert rule evaluation...");
        
        long now = System.currentTimeMillis();
        // 评估过去 1 分钟的数据
        long oneMinuteAgo = now - 60000;

        try {
            SearchRequest searchRequest = new SearchRequest("lt_apm_span");
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            // 简单规则引擎：寻找最近1分钟内发生的慢请求 (>1000ms) 或 报错请求
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                    .must(QueryBuilders.rangeQuery("time").gte(oneMinuteAgo).lte(now))
                    .must(QueryBuilders.termQuery("type.keyword", "req"));
                    
            BoolQueryBuilder anomalyQuery = QueryBuilders.boolQuery()
                    .should(QueryBuilders.rangeQuery("spend").gt(1000))
                    .should(QueryBuilders.termQuery("tags.error", true))
                    .should(QueryBuilders.termQuery("tags.status.keyword", "500"))
                    .minimumShouldMatch(1);
                    
            boolQuery.must(anomalyQuery);

            sourceBuilder.query(boolQuery);
            // 限制最多取 100 条告警事件
            sourceBuilder.size(100);

            searchRequest.source(sourceBuilder);
            SearchResponse response = esClientHolder.getClient().search(searchRequest);

            SearchHit[] hits = response.getHits().getHits();
            for (SearchHit hit : hits) {
                org.xi.lt.server.domain.model.span.SpanView v = org.xi.lt.server.infrastructure.es.SpanViewMapper.fromSource(hit.getSourceAsMap());
                String app = v.getApp();
                String gid = v.getGid();
                long spend = v.getSpend() == null ? 0 : v.getSpend();
                
                String url = "";
                boolean hasError = Boolean.TRUE.equals(v.getError());
                
                org.xi.lt.server.domain.model.span.tags.SpanTags tagsObj = v.getTags();
                if (tagsObj instanceof org.xi.lt.server.domain.model.span.tags.ReqTags) {
                    url = ((org.xi.lt.server.domain.model.span.tags.ReqTags) tagsObj).getUrl();
                } else if (tagsObj instanceof org.xi.lt.server.domain.model.span.tags.ErrorTags) {
                    url = ((org.xi.lt.server.domain.model.span.tags.ErrorTags) tagsObj).getUrl();
                    hasError = true;
                } else if (tagsObj instanceof org.xi.lt.server.domain.model.span.tags.DefaultTags) {
                    Object errVal = ((org.xi.lt.server.domain.model.span.tags.DefaultTags) tagsObj).getOthers().get("error");
                    if (Boolean.TRUE.equals(errVal) || "true".equals(String.valueOf(errVal))) {
                        hasError = true;
                    }
                }

                if (hasError) {
                    triggerAlert(app, url, gid, "Error Rate Anomaly", "A request resulted in an error or exception.");
                } else if (spend > 1000) {
                    triggerAlert(app, url, gid, "High Latency Anomaly", "Request latency is " + spend + "ms, exceeding 1000ms threshold.");
                }
            }
            
            if (hits.length > 0) {
                log.info("Alert evaluation completed. Triggered {} alerts.", hits.length);
            }
        } catch (Exception e) {
            log.error("Error evaluating alert rules", e);
        }
    }

    private void triggerAlert(String app, String url, String gid, String alertType, String message) {
        log.warn("ALERT TRIGGERED - [{}] App: {}, URL: {}, Trace: {} - {}", alertType, app, url, gid, message);
        
        try {
            Map alertDoc = new HashMap();
            alertDoc.put("id", UUID.randomUUID().toString());
            alertDoc.put("time", System.currentTimeMillis());
            alertDoc.put("app", app);
            alertDoc.put("url", url);
            alertDoc.put("gid", gid);
            alertDoc.put("alertType", alertType);
            alertDoc.put("message", message);
            alertDoc.put("status", "NEW"); // 状态：NEW, ACKNOWLEDGED, RESOLVED

            IndexRequest indexRequest = new IndexRequest("lt_apm_alert", "alert");
            indexRequest.source(alertDoc);
            esClientHolder.getClient().index(indexRequest);
        } catch (Exception e) {
            log.error("Failed to save alert to ES", e);
        }
    }
}
