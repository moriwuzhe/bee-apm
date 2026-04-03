package org.xi.lt.agent.plugin.feign;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.FeignAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Feign远程调用埋点插件
 * 支持OpenFeign 10.x/11.x版本和Spring Cloud OpenFeign 2.x/3.x版本
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "feign")
public class FeignPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "feign";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截Feign方法调用入口
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("feign.SynchronousMethodHandler")
                                .or(nameContains("FeignInvocationHandler"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("invoke")
                                .and(takesArguments(1))
                                .and(not(isStatic()));
                    }
                },
                // 拦截Feign Client执行请求
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("feign.Client"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute")
                                .and(takesArguments(2))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return FeignAdvice.class;
    }
}
