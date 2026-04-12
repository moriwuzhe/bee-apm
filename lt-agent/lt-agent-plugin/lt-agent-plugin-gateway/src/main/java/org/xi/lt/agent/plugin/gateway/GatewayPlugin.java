package org.xi.lt.agent.plugin.gateway;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.GatewayAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Spring Cloud Gateway网关埋点插件
 * 支持Spring Cloud Gateway 2.x/3.x版本，网关层链路追踪
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "gateway")
public class GatewayPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "gateway";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截网关请求处理入口
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.springframework.cloud.gateway.handler.FilteringWebHandler")
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("handle")
                                .and(takesArguments(1))
                                .and(returns(hasSuperType(named("reactor.core.publisher.Mono"))))
                                .and(not(isStatic()));
                    }
                },
                // 拦截路由匹配阶段
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.springframework.cloud.gateway.handler.RoutePredicateHandlerMapping")
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("getHandlerInternal")
                                .and(takesArguments(1))
                                .and(returns(hasSuperType(named("reactor.core.publisher.Mono"))))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return GatewayAdvice.class;
    }
}
