package org.xi.lt.common.model.apm;

/**
 * Span上下文持有器
 * 基于ThreadLocal存储当前线程的Span信息，实现链路信息传递
 */
public class SpanContextHolder {

    private SpanContextHolder() {
        // 工具类禁止实例化
    }

    /**
     * 当前线程的Span存储
     */
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();

    /**
     * TraceId HTTP请求头名称
     */
    public static final String HEADER_TRACE_ID = "X-LT-TraceId";

    /**
     * SpanId HTTP请求头名称
     */
    public static final String HEADER_SPAN_ID = "X-LT-SpanId";

    /**
     * 获取当前线程的Span
     * @return 当前Span对象，没有则返回null
     */
    public static Span getCurrentSpan() {
        return CURRENT_SPAN.get();
    }

    /**
     * 设置当前线程的Span
     * @param span Span对象
     */
    public static void setCurrentSpan(Span span) {
        CURRENT_SPAN.set(span);
    }

    /**
     * 移除当前线程的Span
     * 防止内存泄漏，必须在请求结束时调用
     */
    public static void remove() {
        CURRENT_SPAN.remove();
    }

    /**
     * 获取当前TraceId
     * @return TraceId字符串，没有则返回null
     */
    public static String getTraceId() {
        Span span = CURRENT_SPAN.get();
        return span != null ? span.getTraceId() : null;
    }

    /**
     * 获取当前SpanId
     * @return SpanId字符串，没有则返回null
     */
    public static String getSpanId() {
        Span span = CURRENT_SPAN.get();
        return span != null ? span.getSpanId() : null;
    }
}
