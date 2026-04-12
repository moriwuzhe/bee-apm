package org.xi.lt.agent.plugin.nacos;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.NacosAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Nacos配置中心/服务注册发现埋点插件
 * 支持Nacos 1.x/2.x版本，采集配置拉取、配置变更、服务注册/发现等事件
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "nacos")
public class NacosPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "nacos";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截配置拉取
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.alibaba.nacos.client.config.NacosConfigService")
                                .or(named("com.alibaba.nacos.api.config.ConfigService"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("getConfig")
                                .or(named("getConfigInner"))
                                .or(named("queryConfig"))
                                .and(takesArguments(2).or(takesArguments(3)).or(takesArguments(4)))
                                .and(isPublic());
                    }
                },
                // 拦截配置变更监听
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.alibaba.nacos.client.config.NacosConfigService")
                                .or(named("com.alibaba.nacos.client.config.listener.impl.AbstractConfigChangeListener"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("addListener")
                                .or(named("removeListener"))
                                .or(named("receiveConfigInfo"))
                                .and(takesArguments(1).or(takesArguments(2)).or(takesArguments(3)))
                                .and(isPublic());
                    }
                },
                // 拦截服务注册/发现
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.alibaba.nacos.client.naming.NacosNamingService")
                                .or(named("com.alibaba.nacos.api.naming.NamingService"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("registerInstance")
                                .or(named("deregisterInstance"))
                                .or(named("getAllInstances"))
                                .or(named("selectInstances"))
                                .or(named("subscribe"))
                                .or(named("unsubscribe"))
                                .and(takesArguments(1).or(takesArguments(2)).or(takesArguments(3)).or(takesArguments(4)))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return NacosAdvice.class;
    }
}
