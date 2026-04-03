package org.xi.lt.agent.plugin.seata;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.SeataAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Seata分布式事务埋点插件
 * 支持Seata 1.4.x+版本，采集全局事务、分支事务的执行状态
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "seata")
public class SeataPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "seata";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截全局事务开启
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.seata.tm.api.DefaultGlobalTransaction")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("begin")
                                .and(takesArguments(1))
                                .or(named("begin").and(takesArguments(2)))
                                .or(named("begin").and(takesArguments(3)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截全局事务提交、回滚
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.seata.tm.api.DefaultGlobalTransaction")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("commit").or(named("rollback"))
                                .and(takesArguments(0))
                                .and(not(isStatic()));
                    }
                },
                // 拦截分支事务执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("io.seata.rm.tcc.api.BusinessActionContext")
                                .or(named("io.seata.rm.datasource.exec.AbstractDMLBaseExecutor"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute").or(named("prepare"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return SeataAdvice.class;
    }
}
