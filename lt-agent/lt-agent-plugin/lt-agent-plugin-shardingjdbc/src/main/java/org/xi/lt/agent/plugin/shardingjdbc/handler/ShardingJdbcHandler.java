package org.xi.lt.agent.plugin.shardingjdbc.handler;

import org.apache.shardingsphere.driver.jdbc.core.statement.ShardingSpherePreparedStatement;
import org.apache.shardingsphere.infra.route.context.RouteContext;
import org.apache.shardingsphere.infra.route.context.RouteUnit;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.sql.PreparedStatement;
import java.util.Collection;

/**
 * Sharding-JDBC分库分表拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class ShardingJdbcHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("ShardingJdbcHandler");
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_SQL = new ThreadLocal<>();
    private static Field sqlField = null;

    static {
        try {
            sqlField = ShardingSpherePreparedStatement.class.getDeclaredField("sql");
            sqlField.setAccessible(true);
        } catch (NoSuchFieldException e) {
            log.warn("Cannot get sql field from ShardingSpherePreparedStatement", e);
        }
    }

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Sharding-JDBC的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Sharding-JDBC的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * SQL执行前
     */
    public void beforeSqlExecute(String className, String methodName, Object[] allArguments, Object target) {
        try {
            String sql = null;
            // 获取原始SQL
            if (target instanceof ShardingSpherePreparedStatement && sqlField != null) {
                try {
                    sql = (String) sqlField.get(target);
                } catch (IllegalAccessException e) {
                    log.warn("Cannot get sql from ShardingSpherePreparedStatement", e);
                }
            } else if (allArguments.length > 0 && allArguments[0] instanceof String) {
                sql = (String) allArguments[0];
            }

            if (sql != null) {
                CURRENT_SQL.set(sql);
                // 创建SQL执行Span
                Span span = SpanManager.createEntrySpan("shardingjdbc_sql");
                span.addTag("type", "sql");
                span.addTag("action", methodName);
                span.addTag("original_sql", sql);
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("ShardingJdbcHandler beforeSqlExecute error", e);
        }
    }

    /**
     * SQL执行后
     */
    public void afterSqlExecute(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                    if (methodName.equals("executeUpdate") && result instanceof Integer) {
                        span.addTag("affected_rows", result.toString());
                    }
                }
                // 这里等路由信息补全后一起上报
            }
        } catch (Exception e) {
            log.error("ShardingJdbcHandler afterSqlExecute error", e);
        }
    }

    /**
     * SQL路由前
     */
    public void beforeSqlRoute(String className, String methodName, Object[] allArguments, Object target) {
        // 暂时不需要处理
    }

    /**
     * SQL路由后
     */
    public void afterSqlRoute(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null && result instanceof RouteContext) {
                RouteContext routeContext = (RouteContext) result;
                Collection<RouteUnit> routeUnits = routeContext.getRouteUnits();
                
                // 记录路由信息
                span.addTag("route_unit_count", String.valueOf(routeUnits.size()));
                int index = 0;
                for (RouteUnit unit : routeUnits) {
                    if (index >= 5) { // 最多记录5个路由单元
                        break;
                    }
                    span.addTag("route." + index + ".data_source", unit.getDataSourceMapper().getActualName());
                    span.addTag("route." + index + ".table", unit.getTableMappers().toString());
                    index++;
                }
                if (routeUnits.size() > 5) {
                    span.addTag("route.more_count", String.valueOf(routeUnits.size() - 5));
                }
            }
        } catch (Exception e) {
            log.error("ShardingJdbcHandler afterSqlRoute error", e);
        }
    }

    /**
     * 实际SQL执行前
     */
    public void beforeActualExecute(String className, String methodName, Object[] allArguments, Object target) {
        // 暂时不需要处理
    }

    /**
     * 实际SQL执行后
     */
    public void afterActualExecute(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                // 累计实际执行耗时
                Long totalActualCost = (Long) span.getTag("total_actual_cost");
                if (totalActualCost == null) {
                    totalActualCost = 0L;
                }
                totalActualCost += cost;
                span.addTag("total_actual_cost", totalActualCost.toString());
                
                // 上报最终Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("ShardingJdbcHandler afterActualExecute error", e);
        } finally {
            CURRENT_SPAN.remove();
            CURRENT_SQL.remove();
        }
    }
}
