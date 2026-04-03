package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.shardingjdbc.handler.ShardingJdbcHandler;

import java.sql.SQLException;

/**
 * Sharding-JDBC方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class ShardingJdbcAdvice {
    private static ShardingJdbcHandler handler = new ShardingJdbcHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();
    private static final ThreadLocal<Long> START_TIME = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_SQL = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) throws SQLException {
        try {
            CURRENT_ARGS.set(allArguments);
            START_TIME.set(System.currentTimeMillis());
            
            if ((className.contains("ShardingSpherePreparedStatement") || className.contains("ShardingSphereStatement")) && 
                    (methodName.equals("execute") || methodName.equals("executeQuery") || methodName.equals("executeUpdate"))) {
                // SQL执行入口
                handler.beforeSqlExecute(className, methodName, allArguments, target);
            } else if (className.contains("SQLRouteEngine") && methodName.equals("route")) {
                // SQL路由
                handler.beforeSqlRoute(className, methodName, allArguments, target);
            } else if (className.contains("JDBCExecutor") && methodName.equals("execute")) {
                // 实际SQL执行
                handler.beforeActualExecute(className, methodName, allArguments, target);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void onExit(
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.Return Object result,
            @Advice.Thrown Throwable t,
            @Advice.AllArguments Object[] allArguments,
            @Advice.This Object target) {
        try {
            long cost = System.currentTimeMillis() - START_TIME.get();
            if ((className.contains("ShardingSpherePreparedStatement") || className.contains("ShardingSphereStatement")) && 
                    (methodName.equals("execute") || methodName.equals("executeQuery") || methodName.equals("executeUpdate"))) {
                // SQL执行入口结果
                handler.afterSqlExecute(className, methodName, allArguments, result, t, target, cost);
            } else if (className.contains("SQLRouteEngine") && methodName.equals("route")) {
                // SQL路由结果
                handler.afterSqlRoute(className, methodName, allArguments, result, t, target, cost);
            } else if (className.contains("JDBCExecutor") && methodName.equals("execute")) {
                // 实际SQL执行结果
                handler.afterActualExecute(className, methodName, allArguments, result, t, target, cost);
            }
        } finally {
            CURRENT_ARGS.remove();
            START_TIME.remove();
            CURRENT_SQL.remove();
        }
    }
}
