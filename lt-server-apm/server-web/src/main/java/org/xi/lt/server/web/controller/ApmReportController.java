package org.xi.lt.server.web.controller;

import com.alibaba.fastjson.JSON;
import org.apache.http.HttpHost;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.common.model.apm.Span;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * APM数据上报接口
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
@RestController
@RequestMapping("/apm")
public class ApmReportController {

    private static final Logger log = LoggerFactory.getLogger(ApmReportController.class);
    private static final String INDEX_NAME = "lt_apm_span";
    private static final String TYPE_NAME = "span";

    private RestClient restClient;
    private RestHighLevelClient restHighLevelClient;

    @PostConstruct
    public void initEsClient() {
        restClient = RestClient.builder(new HttpHost("127.0.0.1", 9200, "http")).build();
        restHighLevelClient = new RestHighLevelClient(restClient);
        log.info("ES客户端初始化成功");
    }

    /**
     * 接收Agent上报的Span数据
     * @param spanList Span列表
     * @return 上报结果
     */
    @PostMapping("/report")
    public String report(@RequestBody List<Span> spanList) {
        log.info("收到APM上报数据，共{}条Span", spanList.size());
        try {
            if (!spanList.isEmpty()) {
                BulkRequest bulkRequest = new BulkRequest();
                for (Span span : spanList) {
                    IndexRequest indexRequest = new IndexRequest(INDEX_NAME, TYPE_NAME, span.getSpanId());
                    indexRequest.source(JSON.parseObject(JSON.toJSONString(span), Map.class));
                    bulkRequest.add(indexRequest);
                }
                restHighLevelClient.bulk(bulkRequest);
                log.info("{}条Span数据成功存入ES", spanList.size());
            }
            return "success";
        } catch (Exception e) {
            log.error("Span数据保存失败", e);
            return "error";
        }
    }

    /**
     * 接收单条Span上报
     * @param span Span数据
     * @return 上报结果
     */
    @PostMapping("/report/single")
    public String reportSingle(@RequestBody Span span) {
        log.info("收到单条Span上报：traceId={}, name={}", span.getTraceId(), span.getOperationName());
        try {
            IndexRequest indexRequest = new IndexRequest(INDEX_NAME, TYPE_NAME, span.getSpanId());
            indexRequest.source(JSON.parseObject(JSON.toJSONString(span), Map.class));
            restHighLevelClient.index(indexRequest);
            return "success";
        } catch (Exception e) {
            log.error("单条Span保存失败", e);
            return "error";
        }
    }

    /**
     * 根据traceId查询调用链
     * @param traceId 链路ID
     * @return Span列表
     */
    @GetMapping("/trace/{traceId}")
    public List<Span> getTraceById(@PathVariable String traceId) {
        SearchRequest searchRequest = new SearchRequest(INDEX_NAME);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(buildExactMatchQuery("traceId", traceId));
        sourceBuilder.sort("startTime", SortOrder.ASC);
        sourceBuilder.size(1000);
        searchRequest.source(sourceBuilder);
        return executeSearch(searchRequest);
    }

    /**
     * 按应用和时间范围查询Span
     * @param appId 应用ID
     * @param startTime 开始时间戳
     * @param endTime 结束时间戳
     * @param page 页码，默认1
     * @param size 每页大小，默认20
     * @return Span列表
     */
    @GetMapping("/spans")
    public List<Span> getSpansByAppAndTime(
            @RequestParam String appId,
            @RequestParam long startTime,
            @RequestParam long endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        SearchRequest searchRequest = new SearchRequest(INDEX_NAME);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
        boolQuery.must(buildExactMatchQuery("appId", appId));
        boolQuery.must(QueryBuilders.rangeQuery("startTime").gte(startTime).lte(endTime));
        sourceBuilder.query(boolQuery);
        sourceBuilder.sort("startTime", SortOrder.DESC);
        sourceBuilder.from((page - 1) * size);
        sourceBuilder.size(size);
        searchRequest.source(sourceBuilder);
        return executeSearch(searchRequest);
    }

    private QueryBuilder buildExactMatchQuery(String field, String value) {
        return QueryBuilders.boolQuery()
                .should(QueryBuilders.termQuery(field + ".keyword", value))
                .should(QueryBuilders.termQuery(field, value))
                .minimumShouldMatch(1);
    }

    /**
     * 执行查询并转换结果
     */
    private List<Span> executeSearch(SearchRequest searchRequest) {
        try {
            SearchResponse response = restHighLevelClient.search(searchRequest);
            List<Span> spanList = new ArrayList<>();
            response.getHits().forEach(hit -> {
                Map<String, Object> sourceAsMap = hit.getSourceAsMap();
                Span span = JSON.parseObject(JSON.toJSONString(sourceAsMap), Span.class);
                spanList.add(span);
            });
            log.info("ES查询返回{}条结果", spanList.size());
            return spanList;
        } catch (Exception e) {
            log.error("ES查询Span失败", e);
            return new ArrayList<>();
        }
    }

    @PreDestroy
    public void closeEsClient() throws IOException {
        if (restClient != null) {
            restClient.close();
            log.info("ES客户端已关闭");
        }
    }
}
