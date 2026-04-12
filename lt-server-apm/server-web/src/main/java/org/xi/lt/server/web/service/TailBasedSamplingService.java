package org.xi.lt.server.web.service;

import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.web.infrastructure.es.EsClientHolder;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 尾部智能采样服务 (Tail-based Smart Sampling)
 * 用于在服务端缓冲Trace数据，根据整条链路的特征（如是否报错、耗时是否超过阈值）决定是否存入ES。
 */
@Service
public class TailBasedSamplingService {
    private static final Logger log = LoggerFactory.getLogger(TailBasedSamplingService.class);
    
    @Autowired
    private EsClientHolder es;
    
    private final ConcurrentHashMap<String, TraceBuffer> traceBufferMap = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    
    // 缓冲区等待时间：15秒
    private static final long WINDOW_MILLIS = 15000;
    // 基础头部采样率：1% (对于完全健康的低价值链路，保留1%用于基线统计)
    private static final double BASE_SAMPLE_RATE = 0.01;
    // 慢请求阈值：1000ms
    private static final long SLOW_THRESHOLD_MS = 1000;

    @PostConstruct
    public void init() {
        scheduler.scheduleAtFixedRate(this::flushExpiredTraces, 5, 5, TimeUnit.SECONDS);
        log.info("Tail-based Sampling Service initialized. Window: {}ms", WINDOW_MILLIS);
    }

    @PreDestroy
    public void destroy() {
        scheduler.shutdown();
        flushAll();
    }

    /**
     * 将Span数据加入尾部采样缓冲区
     * @param gid 链路全局唯一ID
     * @param spanDocs Span转换为ES Source的Map
     */
    public void addSpans(String gid, List<?> spanDocs) {
        if (es == null || es.getClient() == null) return;
        
        if (spanDocs == null || spanDocs.isEmpty()) {
            return;
        }

        List direct = new ArrayList();
        List sampled = new ArrayList();
        for (Object o : spanDocs) {
            Map doc = o instanceof Map ? (Map) o : null;
            Object typeObj = doc == null ? null : doc.get("type");
            String type = typeObj == null ? "" : String.valueOf(typeObj);
            if ("hb".equals(type) || "jvm".equals(type) || "topo".equals(type)) {
                direct.add(doc);
            } else {
                sampled.add(doc);
            }
        }
        if (!direct.isEmpty()) {
            flushDirectly(direct);
        }
        if (sampled.isEmpty()) {
            return;
        }

        if (gid == null || gid.isEmpty()) {
            // 没有gid的数据无法做链路聚合，直接写入
            flushDirectly(sampled);
            return;
        }
        
        traceBufferMap.compute(gid, (k, v) -> {
            if (v == null) {
                v = new TraceBuffer();
            }
            for (Object x : sampled) {
                Map doc = x instanceof Map ? (Map) x : null;
                v.spans.add(doc);
                Object typeObj = doc == null ? null : doc.get("type");
                String type = typeObj == null ? "" : String.valueOf(typeObj);
                if ("req".equals(type)) {
                    v.hasReq = true;
                }
                // 评估是否有Error
                Object tagsObj = doc.get("tags");
                if (tagsObj instanceof Map) {
                    Map tags = (Map) tagsObj;
                    if (tags.containsKey("error") || tags.containsKey("exception") || tags.containsKey("ex")) {
                        v.hasError = true;
                    }
                    Object status = tags.get("status");
                    if (status != null && status.toString().startsWith("5")) {
                        v.hasError = true;
                    }
                    Object logStr = tags.get("log");
                    if (logStr != null && (logStr.toString().contains("ERROR") || logStr.toString().contains("Exception"))) {
                        v.hasError = true;
                    }
                }
                // 评估耗时
                Object spendObj = doc.get("spend");
                if (spendObj instanceof Number) {
                    long spend = ((Number) spendObj).longValue();
                    if (spend > v.maxSpend) {
                        v.maxSpend = spend;
                    }
                }
            }
            return v;
        });
    }

    private void flushExpiredTraces() {
        long now = System.currentTimeMillis();
        List<String> expiredGids = new ArrayList<>();
        
        for (Map.Entry<String, TraceBuffer> entry : traceBufferMap.entrySet()) {
            if (now - entry.getValue().createTime > WINDOW_MILLIS) {
                expiredGids.add(entry.getKey());
            }
        }
        
        if (expiredGids.isEmpty()) return;
        
        BulkRequest bulkRequest = new BulkRequest();
        int keepCount = 0;
        int dropCount = 0;
        
        for (String gid : expiredGids) {
            TraceBuffer buffer = traceBufferMap.remove(gid);
            if (buffer != null) {
                // 核心采样逻辑：
                // - 含 req 的链路：100% 保留（UI 依赖请求入口）
                // - 出错的：100% 保留
                // - 慢请求：100% 保留
                // - 其他：按基础采样率保留
                boolean shouldKeep = buffer.hasReq || buffer.hasError || buffer.maxSpend >= SLOW_THRESHOLD_MS || Math.random() < BASE_SAMPLE_RATE;
                
                if (shouldKeep) {
                    for (Object o : buffer.spans) {
                        if (!(o instanceof Map)) continue;
                        Map doc = (Map) o;
                        IndexRequest indexRequest = new IndexRequest("lt_apm_span", "span");
                        if (doc.containsKey("id")) {
                            indexRequest.id(doc.get("id").toString());
                        }
                        indexRequest.source(doc);
                        bulkRequest.add(indexRequest);
                        keepCount++;
                    }
                } else {
                    dropCount += buffer.spans.size();
                }
            }
        }
        
        if (keepCount > 0) {
            try {
                es.getClient().bulk(bulkRequest);
            } catch (Exception e) {
                log.error("Failed to flush sampled spans to ES", e);
            }
        }
        if (keepCount > 0 || dropCount > 0) {
            log.debug("Tail-based sampling window processed. Kept spans: {}, Dropped spans: {}", keepCount, dropCount);
        }
    }

    private void flushDirectly(List<?> spanDocs) {
        if (spanDocs == null || spanDocs.isEmpty()) return;
        BulkRequest bulkRequest = new BulkRequest();
        for (Object o : spanDocs) {
            if (!(o instanceof Map)) continue;
            Map doc = (Map) o;
            IndexRequest indexRequest = new IndexRequest("lt_apm_span", "span");
            if (doc.containsKey("id")) {
                indexRequest.id(doc.get("id").toString());
            }
            indexRequest.source(doc);
            bulkRequest.add(indexRequest);
        }
        try {
            es.getClient().bulk(bulkRequest);
        } catch (Exception e) {
            log.error("Failed to flush spans to ES directly", e);
        }
    }

    private void flushAll() {
        if (es == null || es.getClient() == null) return;
        BulkRequest bulkRequest = new BulkRequest();
        for (TraceBuffer buffer : traceBufferMap.values()) {
            for (Object o : buffer.spans) {
                if (!(o instanceof Map)) continue;
                Map doc = (Map) o;
                IndexRequest indexRequest = new IndexRequest("lt_apm_span", "span");
                if (doc.containsKey("id")) {
                    indexRequest.id(doc.get("id").toString());
                }
                indexRequest.source(doc);
                bulkRequest.add(indexRequest);
            }
        }
        if (bulkRequest.numberOfActions() > 0) {
            try {
                es.getClient().bulk(bulkRequest);
            } catch (Exception e) {
                log.error("Failed to flush all spans on shutdown", e);
            }
        }
        traceBufferMap.clear();
    }

    private static class TraceBuffer {
        long createTime = System.currentTimeMillis();
        List spans = new ArrayList();
        boolean hasError = false;
        boolean hasReq = false;
        long maxSpend = 0;
    }
}
