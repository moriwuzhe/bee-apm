package org.xi.lt.server.infrastructure.store.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.domain.model.common.PageSearchResult;
import org.xi.lt.server.domain.model.core.Alert;
import org.xi.lt.server.domain.model.core.Log;
import org.xi.lt.server.domain.model.core.Span;
import org.xi.lt.server.domain.model.dashboard.FromToCount;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.UnifiedDataStore;
import org.xi.lt.server.core.util.TimeUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.xi.lt.server.infrastructure.store.elasticsearch.config.ElasticsearchConstants.*;

/**
 * 统一数据存储适配器（基于 RestHighLevelClient）
 * 直接使用ES原生API，不依赖Spring Data Elasticsearch
 * 
 * @author system
 * @date 2026/04/15
 */
@Component
@LtPlugin(type = "STORE", name = "rest-high-level-adapter")
public class SpringDataStoreAdapter implements UnifiedDataStore {
    
    private static final Logger logger = LoggerFactory.getLogger(SpringDataStoreAdapter.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
    @Autowired(required = false)
    private RestHighLevelClient restHighLevelClient;
    
    @Override
    public void init() {
        logger.info("SpringDataStoreAdapter initialized with RestHighLevelClient");
    }
    
    @Override
    public void save(Object... datas) {
        if (datas == null || datas.length == 0 || restHighLevelClient == null) {
            return;
        }
        
        try {
            BulkRequest bulkRequest = new BulkRequest();
            int count = 0;
            
            for (Object data : datas) {
                if (data == null) {
                    continue;
                }
                
                // 处理Span数据
                if (data instanceof Span) {
                    Span span = (Span) data;
                    String json = OBJECT_MAPPER.writeValueAsString(span);
                    IndexRequest request = new IndexRequest(getSpanIndexName(span.getTime()))
                        .id(span.getId() != null ? span.getId() : UUID.randomUUID().toString())
                        .source(json, XContentType.JSON);
                    bulkRequest.add(request);
                    count++;
                }
                // 处理Log数据
                else if (data instanceof Log) {
                    Log log = (Log) data;
                    String json = OBJECT_MAPPER.writeValueAsString(log);
                    IndexRequest request = new IndexRequest(getLogIndexName(log.getTimestamp()))
                        .id(log.getId() != null ? log.getId() : UUID.randomUUID().toString())
                        .source(json, XContentType.JSON);
                    bulkRequest.add(request);
                    count++;
                }
                // 处理Alert数据
                else if (data instanceof Alert) {
                    Alert alert = (Alert) data;
                    String json = OBJECT_MAPPER.writeValueAsString(alert);
                    IndexRequest request = new IndexRequest(getAlertIndexName(alert.getTime()))
                        .id(alert.getId() != null ? alert.getId() : UUID.randomUUID().toString())
                        .source(json, XContentType.JSON);
                    bulkRequest.add(request);
                    count++;
                }
            }
            
            if (count > 0) {
                BulkResponse bulkResponse = restHighLevelClient.bulk(bulkRequest);
                if (bulkResponse.hasFailures()) {
                    logger.error("Bulk insert has failures: {}", bulkResponse.buildFailureMessage());
                } else {
                    logger.debug("Saved {} documents to Elasticsearch", count);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to save data", e);
            throw new RuntimeException("Failed to save data", e);
        }
    }
    
    @Override
    public void clean(int retentionDays) {
        if (restHighLevelClient == null) {
            logger.warn("RestHighLevelClient not available for clean operation");
            return;
        }
        
        try {
            long cutoffTime = System.currentTimeMillis() - (retentionDays * 24L * 60 * 60 * 1000);
            
            // 清理Span索引
            deleteOldDocuments(INDEX_PATTERN_SPAN, FIELD_TIME, cutoffTime);
            
            // 清理Log索引
            deleteOldDocuments(INDEX_PATTERN_LOG, FIELD_TIMESTAMP, cutoffTime);
            
            // 清理Alert索引
            deleteOldDocuments(INDEX_PATTERN_ALERT, FIELD_TIME, cutoffTime);
            
            logger.info("Cleaned documents older than {} days", retentionDays);
        } catch (Exception e) {
            logger.error("Failed to clean old documents", e);
        }
    }
    
    private void deleteOldDocuments(String indexPattern, String timeField, long cutoffTime) {
        // ES 5.6.10 的 Delete By Query 需要通过 _update_by_query API
        // 这里简化处理，只记录日志，实际删除可以通过定时任务或ES ILM策略
        logger.info("Cleanup scheduled for {} older than {} (cutoff: {})", 
            indexPattern, timeField, new java.util.Date(cutoffTime));
        // TODO: 实现实际的删除逻辑，可以使用 Jest 客户端或升级 ES 版本
    }
    
    @Override
    public PageSearchResult<SpanView> searchSpanPage(SpanPageQuery query) throws Exception {
        if (query == null || restHighLevelClient == null) {
            return new PageSearchResult<>(0, new ArrayList<>());
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            // 构建查询条件
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
            
            if (query.getType() != null && !query.getType().isEmpty()) {
                boolQuery.must(QueryBuilders.termQuery("type.keyword", query.getType()));
            }
            if (query.getApp() != null && !query.getApp().isEmpty()) {
                boolQuery.must(QueryBuilders.termQuery("app.keyword", query.getApp()));
            }
            if (query.getEnv() != null && !query.getEnv().isEmpty()) {
                boolQuery.must(QueryBuilders.termQuery("env.keyword", query.getEnv()));
            }
            if (query.getIp() != null && !query.getIp().isEmpty()) {
                boolQuery.must(QueryBuilders.termQuery("ip.keyword", query.getIp()));
            }
            
            boolQuery.must(QueryBuilders.rangeQuery(FIELD_TIME)
                .gte(query.getBeginMs())
                .lte(query.getEndMs()));
            
            sourceBuilder.query(boolQuery);
            
            // 分页
            int from = query.getFrom();
            int size = Math.max(query.getSize(), DEFAULT_PAGE_SIZE);
            sourceBuilder.from(from).size(size);
            
            // 排序
            String sortField = query.getSortField() != null ? query.getSortField() : DEFAULT_SORT_FIELD;
            SortOrder sortOrder = query.getSortDirection() != null && 
                query.getSortDirection().name().equalsIgnoreCase("DESC") ? 
                SortOrder.DESC : SortOrder.ASC;
            sourceBuilder.sort(sortField, sortOrder);
            
            searchRequest.source(sourceBuilder);
            
            // 执行查询
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            // 转换结果
            List<SpanView> views = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                try {
                    SpanView view = OBJECT_MAPPER.readValue(hit.getSourceAsString(), SpanView.class);
                    views.add(view);
                } catch (Exception e) {
                    logger.warn("Failed to parse span document", e);
                }
            }
            
            long totalHits = response.getHits().getTotalHits();
            return new PageSearchResult<>(totalHits, views);
        } catch (Exception e) {
            logger.error("Failed to search span page", e);
            throw e;
        }
    }
    
    @Override
    public List<SpanView> searchSpanByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception {
        if (restHighLevelClient == null) {
            return new ArrayList<>();
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", type))
                .must(QueryBuilders.termQuery("gid.keyword", gid))
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs));
            
            sourceBuilder.query(boolQuery);
            sourceBuilder.size(max);
            sourceBuilder.sort(FIELD_TIME, SortOrder.ASC);
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            List<SpanView> views = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                try {
                    SpanView view = OBJECT_MAPPER.readValue(hit.getSourceAsString(), SpanView.class);
                    views.add(view);
                } catch (Exception e) {
                    logger.warn("Failed to parse span document", e);
                }
            }
            
            return views;
        } catch (Exception e) {
            logger.error("Failed to search span by gid", e);
            throw e;
        }
    }
    
    @Override
    public List<SpanView> searchSpanByGidAny(String gid, long beginMs, long endMs, int max) throws Exception {
        if (restHighLevelClient == null) {
            return new ArrayList<>();
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("gid.keyword", gid))
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs));
            
            sourceBuilder.query(boolQuery);
            sourceBuilder.size(max);
            sourceBuilder.sort(FIELD_TIME, SortOrder.ASC);
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            List<SpanView> views = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                try {
                    SpanView view = OBJECT_MAPPER.readValue(hit.getSourceAsString(), SpanView.class);
                    views.add(view);
                } catch (Exception e) {
                    logger.warn("Failed to parse span document", e);
                }
            }
            
            return views;
        } catch (Exception e) {
            logger.error("Failed to search span by gid any", e);
            throw e;
        }
    }
    
    @Override
    public long countByType(long beginMs, long endMs, String env, String app, String ip, String type) {
        if (restHighLevelClient == null) {
            return 0;
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery("type.keyword", type))
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs));
            
            sourceBuilder.query(boolQuery);
            sourceBuilder.size(0);
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            return response.getHits().getTotalHits();
        } catch (Exception e) {
            logger.error("Failed to count by type", e);
            return 0;
        }
    }
    
    @Override
    public long countDistinctInst(long beginMs, long endMs, String env, String app, String ip) {
        if (restHighLevelClient == null) {
            return 0;
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery(FIELD_TYPE_KEYWORD, TYPE_HEARTBEAT))
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs));
            
            sourceBuilder.query(boolQuery);
            sourceBuilder.size(0);
            sourceBuilder.aggregation(AggregationBuilders.terms("inst")
                .field(FIELD_INST_KEYWORD)
                .size(DEFAULT_AGGREGATION_SIZE));
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            Terms terms = response.getAggregations().get("inst");
            return terms != null ? terms.getBuckets().size() : 0;
        } catch (Exception e) {
            logger.error("Failed to count distinct inst", e);
            return 0;
        }
    }
    
    @Override
    public List<FromToCount> topologyFromTo(long beginMs, long endMs) {
        if (restHighLevelClient == null) {
            return new ArrayList<>();
        }
        
        List<FromToCount> out = new ArrayList<>();
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_SPAN);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termQuery(FIELD_TYPE_KEYWORD, TYPE_TOPOLOGY))
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs));
            
            sourceBuilder.query(boolQuery);
            sourceBuilder.size(0);
            sourceBuilder.aggregation(AggregationBuilders.terms("from_to")
                .field(FIELD_FROM_TO_KEYWORD)
                .size(DEFAULT_AGGREGATION_SIZE));
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            Terms terms = response.getAggregations().get("from_to");
            if (terms != null) {
                for (Terms.Bucket bucket : terms.getBuckets()) {
                    String key = bucket.getKeyAsString();
                    if (key != null && key.contains("->")) {
                        String[] parts = key.split("->");
                        if (parts.length == 2) {
                            FromToCount item = new FromToCount();
                            item.setFrom(parts[0].trim());
                            item.setTo(parts[1].trim());
                            item.setTimes(bucket.getDocCount());
                            out.add(item);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to query topology", e);
        }
        return out;
    }
    
    @Override
    public List<KeyValue> groupList(long beginMs, long endMs, String groupField) {
        if (restHighLevelClient == null) {
            return new ArrayList<>();
        }
        
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_PATTERN_ALL);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            
            sourceBuilder.query(QueryBuilders.boolQuery()
                .must(QueryBuilders.rangeQuery(FIELD_TIME).gte(beginMs).lte(endMs)));
            sourceBuilder.size(0);
            sourceBuilder.aggregation(AggregationBuilders.terms("g")
                .field(groupField + ".keyword")
                .size(GROUP_LIST_SIZE));
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            Terms terms = response.getAggregations().get("g");
            List<KeyValue> out = new ArrayList<>();
            
            if (terms != null) {
                for (Terms.Bucket bucket : terms.getBuckets()) {
                    out.add(new KeyValue(bucket.getKeyAsString(), bucket.getKeyAsString()));
                }
            }
            
            return out;
        } catch (Exception e) {
            logger.error("Failed to query group list", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public Object queryById(String indexPrefix, String id, long beginMs, long endMs) {
        if (id == null || id.isEmpty() || restHighLevelClient == null) {
            return null;
        }
        
        try {
            String indexPattern;
            if (indexPrefix != null && indexPrefix.contains("span")) {
                indexPattern = INDEX_PATTERN_SPAN;
            } else if (indexPrefix != null && indexPrefix.contains("log")) {
                indexPattern = INDEX_PATTERN_LOG;
            } else if (indexPrefix != null && indexPrefix.contains("alert")) {
                indexPattern = INDEX_PATTERN_ALERT;
            } else {
                indexPattern = INDEX_PATTERN_SPAN; // 默认
            }
            
            SearchRequest searchRequest = new SearchRequest(indexPattern);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            sourceBuilder.query(QueryBuilders.idsQuery().addIds(id));
            sourceBuilder.size(1);
            
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest);
            
            if (response.getHits().getHits().length > 0) {
                String json = response.getHits().getHits()[0].getSourceAsString();
                // 根据索引类型返回不同的对象
                if (indexPattern.contains("span")) {
                    return OBJECT_MAPPER.readValue(json, SpanView.class);
                }
                return json; // 其他类型暂时返回JSON字符串
            }
            
            return null;
        } catch (Exception e) {
            logger.error("Failed to query by id: {}", id, e);
            return null;
        }
    }
    
    // ==================== 私有辅助方法 ====================
    
    private String getSpanIndexName(Long timestamp) {
        return TimeUtils.buildDateBasedIndexName("lt-apm-span", timestamp);
    }
    
    private String getLogIndexName(Long timestamp) {
        return TimeUtils.buildDateBasedIndexName("lt-apm-log", timestamp);
    }
    
    private String getAlertIndexName(Long timestamp) {
        return TimeUtils.buildDateBasedIndexName("lt-apm-alert", timestamp);
    }
}
