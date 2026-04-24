package org.xi.lt.code.dynamic;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.server.domain.model.span.SpanView;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 内存 Span 存储服务
 * 用于演示目的，存储和查询 Span 数据
 */
@Slf4j
public class InMemorySpanStore {

    private final Map<String, List<SpanView>> traceSpans = new ConcurrentHashMap<>();
    private final Map<String, SpanView> spanById = new ConcurrentHashMap<>();

    /**
     * 保存 Span 列表
     */
    public void saveSpans(List<SpanView> spans) {
        for (SpanView span : spans) {
            saveSpan(span);
        }
    }

    /**
     * 保存单个 Span
     */
    public void saveSpan(SpanView span) {
        if (span == null || span.getGid() == null) {
            return;
        }

        spanById.put(span.getId(), span);
        traceSpans.computeIfAbsent(span.getGid(), k -> Collections.synchronizedList(new ArrayList<>()))
                .add(span);

        log.debug("保存 Span: traceId={}, spanId={}, type={}",
                span.getGid(), span.getId(), span.getType());
    }

    /**
     * 根据 Trace ID 查询所有 Span
     */
    public List<SpanView> findByTraceId(String traceId) {
        List<SpanView> spans = traceSpans.get(traceId);
        if (spans == null) {
            return Collections.emptyList();
        }
        return new ArrayList<>(spans);
    }

    /**
     * 根据 Trace ID 查询，按时间排序
     */
    public List<SpanView> findByTraceIdSorted(String traceId) {
        return findByTraceId(traceId).stream()
                .sorted(Comparator.comparing(SpanView::getTime))
                .collect(Collectors.toList());
    }

    /**
     * 获取所有 Trace ID 列表
     */
    public List<String> getAllTraceIds() {
        return new ArrayList<>(traceSpans.keySet());
    }

    /**
     * 获取最近的 Trace 列表
     */
    public List<TraceInfo> getRecentTraces(int limit) {
        return traceSpans.entrySet().stream()
                .map(e -> {
                    List<SpanView> spans = e.getValue();
                    long minTime = spans.stream().mapToLong(SpanView::getTime).min().orElse(0);
                    long maxTime = spans.stream().mapToLong(s -> s.getTime() + (s.getSpend() != null ? s.getSpend() : 0)).max().orElse(0);
                    String firstApp = spans.stream().findFirst().map(SpanView::getApp).orElse("unknown");
                    return new TraceInfo(e.getKey(), firstApp, minTime, maxTime - minTime, spans.size());
                })
                .sorted(Comparator.comparing(TraceInfo::getStartTime).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * 根据 Span ID 查询
     */
    public SpanView findBySpanId(String spanId) {
        return spanById.get(spanId);
    }

    /**
     * 清除所有数据
     */
    public void clear() {
        traceSpans.clear();
        spanById.clear();
        log.info("已清除所有 Span 数据");
    }

    /**
     * 获取存储的 Trace 数量
     */
    public int getTraceCount() {
        return traceSpans.size();
    }

    /**
     * 获取存储的 Span 总数
     */
    public int getSpanCount() {
        return spanById.size();
    }

    /**
     * Trace 信息
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class TraceInfo {
        private String traceId;
        private String app;
        private long startTime;
        private long duration;
        private int spanCount;
    }
}
