package org.xi.lt.agent.plugin.hystrix.handler;

import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandKey;
import com.netflix.hystrix.HystrixCommandMetrics;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Hystrix熔断限流拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class HystrixHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("HystrixHandler");
    private static final ThreadLocal<Span> COMMAND_SPAN = new ThreadLocal<>();
    private static final ThreadLocal<Span> RUN_SPAN = new ThreadLocal<>();
    private static final ThreadLocal<Span> FALLBACK_SPAN = new ThreadLocal<>();

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Hystrix的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Hystrix的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 命令执行前
     */
    public void beforeExecute(HystrixCommand command, String className, String methodName, Object[] allArguments) {
        try {
            // 创建Hystrix命令Span
            Span span = SpanManager.createEntrySpan("hystrix_command");
            span.addTag("command_key", command.getCommandKey().name());
            span.addTag("group_key", command.getCommandGroup().name());
            span.addTag("action", methodName);
            COMMAND_SPAN.set(span);
        } catch (Exception e) {
            log.error("HystrixHandler beforeExecute error", e);
        }
    }

    /**
     * 命令执行后
     */
    public void afterExecute(HystrixCommand command, String className, String methodName, Object[] allArguments, Object result, Throwable t) {
        try {
            Span span = COMMAND_SPAN.get();
            if (span != null) {
                calculateSpend(span);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                    span.addTag("is_response_from_fallback", String.valueOf(command.isResponseFromFallback()));
                    span.addTag("is_circuit_breaker_open", String.valueOf(command.isCircuitBreakerOpen()));
                    span.addTag("execution_exception", command.getExecutionException() != null ? command.getExecutionException().getMessage() : "");
                } else {
                    span.addTag("status", "success");
                }
                // 上报命令Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("HystrixHandler afterExecute error", e);
        } finally {
            COMMAND_SPAN.remove();
        }
    }

    /**
     * 业务逻辑执行前
     */
    public void beforeRun(HystrixCommand command, String className, String methodName, Object[] allArguments) {
        try {
            // 创建业务执行Span
            Span span = SpanManager.createEntrySpan("hystrix_run");
            span.addTag("command_key", command.getCommandKey().name());
            RUN_SPAN.set(span);
        } catch (Exception e) {
            log.error("HystrixHandler beforeRun error", e);
        }
    }

    /**
     * 业务逻辑执行后
     */
    public void afterRun(HystrixCommand command, String className, String methodName, Object[] allArguments, Object result, Throwable t) {
        try {
            Span span = RUN_SPAN.get();
            if (span != null) {
                calculateSpend(span);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                // 上报业务执行Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("HystrixHandler afterRun error", e);
        } finally {
            RUN_SPAN.remove();
        }
    }

    /**
     * 降级逻辑执行前
     */
    public void beforeFallback(HystrixCommand command, String className, String methodName, Object[] allArguments) {
        try {
            // 创建降级执行Span
            Span span = SpanManager.createEntrySpan("hystrix_fallback");
            span.addTag("command_key", command.getCommandKey().name());
            FALLBACK_SPAN.set(span);
        } catch (Exception e) {
            log.error("HystrixHandler beforeFallback error", e);
        }
    }

    /**
     * 降级逻辑执行后
     */
    public void afterFallback(HystrixCommand command, String className, String methodName, Object[] allArguments, Object result, Throwable t) {
        try {
            Span span = FALLBACK_SPAN.get();
            if (span != null) {
                calculateSpend(span);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                span.addTag("fallback_reason", command.getExecutionException() != null ? command.getExecutionException().getMessage() : "unknown");
                // 上报降级执行Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("HystrixHandler afterFallback error", e);
        } finally {
            FALLBACK_SPAN.remove();
        }
    }

    /**
     * 熔断器操作前
     */
    public void beforeCircuitBreakerAction(String methodName, Object circuitBreaker) {
        // 暂时不需要处理
    }

    /**
     * 熔断器操作后
     */
    public void afterCircuitBreakerAction(String methodName, Object circuitBreaker, Object result, Throwable t) {
        try {
            if (methodName.equals("markNonSuccess") && t == null) {
                // 标记失败，可能触发熔断
                Span span = SpanManager.createEntrySpan("hystrix_circuit_breaker");
                span.addTag("action", "mark_non_success");
                span.addTag("circuit_breaker", circuitBreaker.getClass().getSimpleName());
                calculateSpend(span);
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            } else if (methodName.equals("markSuccess") && t == null) {
                // 标记成功，熔断器可能关闭
                Span span = SpanManager.createEntrySpan("hystrix_circuit_breaker");
                span.addTag("action", "mark_success");
                span.addTag("circuit_breaker", circuitBreaker.getClass().getSimpleName());
                calculateSpend(span);
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            } else if (methodName.equals("allowRequest") && result != null) {
                // 请求是否被允许
                Boolean allowed = (Boolean) result;
                if (!allowed) {
                    Span span = SpanManager.createEntrySpan("hystrix_circuit_breaker");
                    span.addTag("action", "reject_request");
                    span.addTag("circuit_breaker", circuitBreaker.getClass().getSimpleName());
                    calculateSpend(span);
                    LtConfig.me().fillEnvInfo(span);
                    ReporterFactory.report(span);
                }
            }
        } catch (Exception e) {
            log.error("HystrixHandler afterCircuitBreakerAction error", e);
        }
    }
}
