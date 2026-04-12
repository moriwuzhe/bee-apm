package org.xi.lt.agent.plugin.apollo;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.ApolloAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Apollo配置中心埋点插件
 * 支持Apollo 1.x/2.x版本，采集配置拉取、配置变更、灰度发布等事件
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "apollo")
public class ApolloPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "apollo";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截配置拉取
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.ctrip.framework.apollo.internals.DefaultConfig")
                                .or(named("com.ctrip.framework.apollo.ConfigService"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("getProperty")
                                .or(named("getIntProperty"))
                                .or(named("getLongProperty"))
                                .or(named("getBooleanProperty"))
                                .or(named("getDoubleProperty"))
                                .or(named("getArrayProperty"))
                                .or(named("getDateProperty"))
                                .or(named("getEnumProperty"))
                                .and(takesArguments(2))
                                .and(isPublic());
                    }
                },
                // 拦截配置变更监听
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.ctrip.framework.apollo.internals.DefaultConfig")
                                .or(named("com.ctrip.framework.apollo.AbstractConfig"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("addChangeListener")
                                .or(named("removeChangeListener"))
                                .or(named("fireConfigChange"))
                                .and(takesArguments(1).or(takesArguments(2)))
                                .and(isPublic());
                    }
                },
                // 拦截配置加载
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.ctrip.framework.apollo.internals.RemoteConfigRepository")
                                .or(named("com.ctrip.framework.apollo.internals.LocalFileConfigRepository"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("loadConfig")
                                .or(named("fetchConfig"))
                                .or(named("sync"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return ApolloAdvice.class;
    }
}
