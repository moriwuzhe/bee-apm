package org.xi.lt.agent.plugin.resilience4j.handler;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.ratelimiter.RateLimiter;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Resilience4j熔断限流拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class Resilience4jHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("Resilience4jHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Resilience4j的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Resilience4j的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 熔断器操作前
     */
    public void beforeCircuitBreakerAction(CircuitBreaker circuitBreaker, String methodName, Object[] allArguments) {
        // 暂时不需要处理
    }

    /**
     * 熔断器操作后
     */
    public void afterCircuitBreakerAction(CircuitBreaker circuitBreaker, String methodName, Object[] allArguments, Object result, Throwable t, long cost) {
        try {
            String circuitBreakerName = circuitBreaker.getName();
            CircuitBreaker.State state = circuitBreaker.getState();
            
            if (methodName.equals("acquirePermission")) {
                // 权限申请结果
                Boolean allowed = (Boolean) result;
                if (!allowed) {
                    // 被熔断器拒绝
                    Span span = SpanManager.createEntrySpan("resilience4j_circuit_breaker");
                    span.addTag("type", "circuit_breaker");
                    span.addTag("name", circuitBreakerName);
                    span.addTag("action", "reject_request");
                    span.addTag("state", state.name());
                    span.setSpend(cost);
                    BeeConfig.me().fillEnvInfo(span);
                    ReporterFactory.report(span);
                }
            } else if (methodName.equals("onSuccess")) {
                // 调用成功
                Span span = SpanManager.createEntrySpan("resilience4j_circuit_breaker");
                span.addTag("type", "circuit_breaker");
                span.addTag("name", circuitBreakerName);
                span.addTag("action", "mark_success");
                span.addTag("state", state.name());
                span.setSpend(cost);
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            } else if (methodName.equals("onError")) {
                // 调用失败
                Span span = SpanManager.createEntrySpan("resilience4j_circuit_breaker");
                span.addTag("type", "circuit_breaker");
                span.addTag("name", circuitBreakerName);
                span.addTag("action", "mark_error");
                span.addTag("state", state.name());
                if (allArguments.length > 0 && allArguments[0] instanceof Throwable) {
                    span.addTag("error_msg", ((Throwable) allArguments[0]).getMessage());
                }
                span.setSpend(cost);
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            
            // 记录熔断器状态变化
            if (state != CircuitBreaker.State.CLOSED) {
                Span span = SpanManager.createEntrySpan("resilience4j_circuit_breaker_state");
                span.addTag("name", circuitBreakerName);
                span.addTag("state", state.name());
                span.addTag("failure_rate", String.valueOf(circuitBreaker.getMetrics().getFailureRate()));
                span.addTag("slow_call_rate", String.valueOf(circuitBreaker.getMetrics().getSlowCallRate()));
                span.addTag("number_of_buffered_calls", String.valueOf(circuitBreaker.getMetrics().getNumberOfBufferedCalls()));
                span.setSpend(cost);
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("Resilience4jHandler afterCircuitBreakerAction error", e);
        }
    }

    /**
     * 限流操作前
     */
    public void beforeRateLimiterAction(RateLimiter rateLimiter, String methodName, Object[] allArguments) {
        // 暂时不需要处理
    }

    /**
     * 限流操作后
     */
    public void afterRateLimiterAction(RateLimiter rateLimiter, String methodName, Object[] allArguments, Object result, Throwable t, long cost) {
        try {
            String rateLimiterName = rateLimiter.getName();
            
            if (methodName.equals("acquirePermission") || methodName.equals("reservePermission")) {
                Boolean allowed = (Boolean) result;
                if (!allowed) {
                    // 被限流拒绝
                    Span span = SpanManager.createEntrySpan("resilience4j_rate_limiter");
                    span.addTag("type", "rate_limiter");
                    span.addTag("name", rateLimiterName);
                    span.addTag("action", "reject_request");
                    span.addTag("available_permissions", String.valueOf(rateLimiter.getMetrics().getAvailablePermissions()));
                    span.addTag("waiting_threads", String.valueOf(rateLimiter.getMetrics().getNumberOfWaitingThreads()));
                    span.setSpend(cost);
                    BeeConfig.me().fillEnvInfo(span);
                    ReporterFactory.report(span);
                }
            }
        } catch (Exception e) {
            log.error("Resilience4jHandler afterRateLimiterAction error", e);
        }
    }

    /**
     * 隔离舱操作前
     */
    public void beforeBulkheadAction(Bulkhead bulkhead, String methodName, Object[] allArguments) {
        // 暂时不需要处理
    }

    /**
     * 隔离舱操作后
     */
    public void afterBulkheadAction(Bulkhead bulkhead, String methodName, Object[] allArguments, Object result, Throwable t, long cost) {
        try {
            String bulkheadName = bulkhead.getName();
            
            if (methodName.equals("acquirePermission") || methodName.equals("tryAcquirePermission")) {
                Boolean allowed = (Boolean) result;
                if (!allowed) {
                    // 被隔离舱拒绝
                    Span span = SpanManager.createEntrySpan("resilience4j_bulkhead");
                    span.addTag("type", "bulkhead");
                    span.addTag("name", bulkheadName);
                    span.addTag("action", "reject_request");
                    span.addTag("available_concurrent_calls", String.valueOf(bulkhead.getMetrics().getAvailableConcurrentCalls()));
                    span.addTag("max_allowed_concurrent_calls", String.valueOf(bulkhead.getBulkheadConfig().getMaxConcurrentCalls()));
                    span.setSpend(cost);
                    BeeConfig.me().fillEnvInfo(span);
                    ReporterFactory.report(span);
                }
            }
        } catch (Exception e) {
            log.error("Resilience4jHandler afterBulkheadAction error", e);
        }
    }
}
