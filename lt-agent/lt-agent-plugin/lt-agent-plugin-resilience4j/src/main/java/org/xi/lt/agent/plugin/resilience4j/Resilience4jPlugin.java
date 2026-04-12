package org.xi.lt.agent.plugin.resilience4j;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.Resilience4jAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Resilience4j熔断限流组件埋点插件
 * 支持Resilience4j 1.7.x版本，支持熔断器、限流、隔离舱、重试等事件采集
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "resilience4j")
public class Resilience4jPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "resilience4j";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截CircuitBreaker执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.github.resilience4j.circuitbreaker.CircuitBreaker")
                                .and(isInterface());
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("acquirePermission")
                                .or(named("onSuccess"))
                                .or(named("onError"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(isPublic());
                    }
                },
                // 拦截RateLimiter执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.github.resilience4j.ratelimiter.RateLimiter")
                                .and(isInterface());
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("acquirePermission")
                                .or(named("reservePermission"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(isPublic());
                    }
                },
                // 拦截Bulkhead执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.github.resilience4j.bulkhead.Bulkhead")
                                .or(named("io.github.resilience4j.bulkhead.ThreadPoolBulkhead"))
                                .and(isInterface());
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("acquirePermission")
                                .or(named("tryAcquirePermission"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return Resilience4jAdvice.class;
    }
}
