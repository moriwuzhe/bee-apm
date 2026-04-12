package org.xi.lt.agent.plugin.xxljob;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.XxlJobAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * XXL-Job定时任务埋点插件
 * 支持XXL-Job 2.x版本，采集定时任务执行、超时、失败、重试等事件
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "xxljob")
public class XxlJobPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "xxljob";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截任务执行入口
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("com.xxl.job.core.handler.IJobHandler"))
                                .or(named("com.xxl.job.core.handler.impl.MethodJobHandler"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute")
                                .and(takesArguments(String.class))
                                .and(isPublic());
                    }
                },
                // 拦截任务执行器初始化
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.xxl.job.core.executor.XxlJobExecutor")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("start")
                                .or(named("destroy"))
                                .or(named("registerJobHandler"))
                                .and(takesArguments(0).or(takesArguments(2)))
                                .and(isPublic());
                    }
                },
                // 拦截任务回调
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.xxl.job.core.biz.client.AdminBizClient")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("callback")
                                .and(takesArguments(1))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return XxlJobAdvice.class;
    }
}
