package org.xi.lt.agent.plugin.shardingjdbc;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.ShardingJdbcAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Sharding-JDBC分库分表埋点插件
 * 支持ShardingSphere 5.x版本，采集SQL路由、分库分表执行信息
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "shardingjdbc")
public class ShardingJdbcPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "shardingjdbc";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截SQL执行入口
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.apache.shardingsphere.driver.jdbc.core.statement.ShardingSpherePreparedStatement")
                                .or(named("org.apache.shardingsphere.driver.jdbc.core.statement.ShardingSphereStatement"))
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute")
                                .or(named("executeQuery"))
                                .or(named("executeUpdate"))
                                .and(takesArguments(0).or(takesArguments(1)))
                                .and(isPublic());
                    }
                },
                // 拦截SQL路由
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.apache.shardingsphere.infra.route.SQLRouteEngine")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("route")
                                .and(takesArguments(3))
                                .and(isPublic());
                    }
                },
                // 拦截实际SQL执行
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.apache.shardingsphere.infra.executor.sql.execute.engine.driver.jdbc.JDBCExecutor")
                                .and(not(isInterface()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute")
                                .and(takesArguments(1))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return ShardingJdbcAdvice.class;
    }
}
