package org.xi.lt.agent.plugin.hystrix;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.HystrixAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Hystrix熔断限流组件埋点插件
 * 支持Hystrix 1.5.x版本，采集熔断、降级、超时、线程池拒绝等事件
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "hystrix")
public class HystrixPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "hystrix";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截HystrixCommand执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("com.netflix.hystrix.HystrixCommand"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("run")
                                .or(named("getFallback"))
                                .or(named("execute"))
                                .or(named("queue"))
                                .and(takesArguments(0))
                                .and(not(isStatic()));
                    }
                },
                // 拦截熔断器状态变化
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.netflix.hystrix.HystrixCircuitBreaker$HystrixCircuitBreakerImpl")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("allowRequest")
                                .or(named("markSuccess"))
                                .or(named("markNonSuccess"))
                                .and(takesArguments(0))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return HystrixAdvice.class;
    }
}
