package org.xi.lt.server.web.alert;

import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RestHighLevelClient;
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

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@EnableScheduling
public class AlertEngineService {
    private static final Logger log = LoggerFactory.getLogger(AlertEngineService.class);

    @Autowired(required = false)
    private RestHighLevelClient restHighLevelClient;

    // 每分钟执行一次告警规则评估
    @Scheduled(cron = "0 * * * * ?")
    public void evaluateRules() {
        if (restHighLevelClient == null) return;
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
                    .must(QueryBuilders.termQuery("type.keyword", "REQUEST"));
                    
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
            SearchResponse response = restHighLevelClient.search(searchRequest);

            SearchHit[] hits = response.getHits().getHits();
            for (SearchHit hit : hits) {
                Map<String, Object> source = hit.getSourceAsMap();
                String app = (String) source.get("app");
                String gid = (String) source.get("gid");
                Object spendObj = source.get("spend");
                long spend = spendObj instanceof Number ? ((Number) spendObj).longValue() : 0;
                
                String url = "";
                boolean hasError = false;
                Object tagsObj = source.get("tags");
                if (tagsObj instanceof Map) {
                    Map tags = (Map) tagsObj;
                    url = (String) tags.get("url");
                    if (tags.containsKey("error") && Boolean.TRUE.equals(tags.get("error"))) {
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
            Map<String, Object> alertDoc = new HashMap<>();
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
            restHighLevelClient.index(indexRequest);
        } catch (Exception e) {
            log.error("Failed to save alert to ES", e);
        }
    }
}
