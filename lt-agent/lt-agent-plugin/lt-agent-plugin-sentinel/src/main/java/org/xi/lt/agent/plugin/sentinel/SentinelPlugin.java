package org.xi.lt.agent.plugin.sentinel;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.SentinelAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Sentinel流量控制组件埋点插件
 * 支持Sentinel 1.8.x版本，采集限流、降级、熔断等流量控制事件
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "sentinel")
public class SentinelPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "sentinel";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截SphU.entry()方法，流量进入点
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.alibaba.csp.sentinel.SphU")
                                .or(named("com.alibaba.csp.sentinel.SphO"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("entry")
                                .and(takesArguments(1).or(takesArguments(2)).or(takesArguments(3)).or(takesArguments(4)).or(takesArguments(5)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截Entry.exit()方法，流量退出点
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.alibaba.csp.sentinel.Entry")
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("exit")
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return SentinelAdvice.class;
    }
}
