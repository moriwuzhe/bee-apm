package org.xi.lt.agent.plugin.interceptor;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.ratelimiter.RateLimiter;
import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.resilience4j.handler.Resilience4jHandler;

/**
 * Resilience4j方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class Resilience4jAdvice {
    private static Resilience4jHandler handler = new Resilience4jHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();
    private static final ThreadLocal<Long> START_TIME = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            CURRENT_ARGS.set(allArguments);
            START_TIME.set(System.currentTimeMillis());
            
            if (target instanceof CircuitBreaker) {
                // 熔断器操作
                handler.beforeCircuitBreakerAction((CircuitBreaker) target, methodName, allArguments);
            } else if (target instanceof RateLimiter) {
                // 限流操作
                handler.beforeRateLimiterAction((RateLimiter) target, methodName, allArguments);
            } else if (target instanceof Bulkhead) {
                // 隔离舱操作
                handler.beforeBulkheadAction((Bulkhead) target, methodName, allArguments);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void onExit(
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.Return Object result,
            @Advice.Thrown Throwable t,
            @Advice.AllArguments Object[] allArguments,
            @Advice.This Object target) {
        try {
            long cost = System.currentTimeMillis() - START_TIME.get();
            if (target instanceof CircuitBreaker) {
                // 熔断器操作结果
                handler.afterCircuitBreakerAction((CircuitBreaker) target, methodName, allArguments, result, t, cost);
            } else if (target instanceof RateLimiter) {
                // 限流操作结果
                handler.afterRateLimiterAction((RateLimiter) target, methodName, allArguments, result, t, cost);
            } else if (target instanceof Bulkhead) {
                // 隔离舱操作结果
                handler.afterBulkheadAction((Bulkhead) target, methodName, allArguments, result, t, cost);
            }
        } finally {
            CURRENT_ARGS.remove();
            START_TIME.remove();
        }
    }
}
