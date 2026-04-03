package org.xi.lt.agent.plugin.dubbo;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.DubboAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Dubbo RPC调用埋点插件
 * 支持Dubbo 2.7.x版本，覆盖Provider和Consumer两端
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "dubbo")
public class DubboPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "dubbo";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截所有Invoker.invoke()方法，后续在Advice里区分Provider和Consumer
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("org.apache.dubbo.rpc.Invoker"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("invoke")
                                .and(takesArguments(1))
                                .and(returns(named("org.apache.dubbo.rpc.Result")));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return DubboAdvice.class;
    }
}
