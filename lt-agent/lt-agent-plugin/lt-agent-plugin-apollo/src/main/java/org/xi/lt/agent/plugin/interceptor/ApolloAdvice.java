package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.apollo.handler.ApolloHandler;

/**
 * Apollo方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class ApolloAdvice {
    private static ApolloHandler handler = new ApolloHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();
    private static final ThreadLocal<Long> START_TIME = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            CURRENT_ARGS.set(allArguments);
            START_TIME.set(System.currentTimeMillis());
            
            if ((className.contains("DefaultConfig") || className.contains("AbstractConfig")) && methodName.startsWith("get") && !methodName.startsWith("getConfig")) {
                // 获取配置属性
                handler.beforeGetProperty(className, methodName, allArguments, target);
            } else if (methodName.equals("addChangeListener") || methodName.equals("removeChangeListener")) {
                // 配置监听操作
                handler.beforeListenerOperation(className, methodName, allArguments, target);
            } else if (methodName.equals("fireConfigChange")) {
                // 配置变更通知
                handler.beforeConfigChange(className, methodName, allArguments, target);
            } else if (className.contains("ConfigRepository") && (methodName.equals("loadConfig") || methodName.equals("fetchConfig") || methodName.equals("sync"))) {
                // 配置加载/同步
                handler.beforeConfigLoad(className, methodName, allArguments, target);
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
            if ((className.contains("DefaultConfig") || className.contains("AbstractConfig")) && methodName.startsWith("get") && !methodName.startsWith("getConfig")) {
                // 获取配置属性结果
                handler.afterGetProperty(className, methodName, allArguments, result, t, target, cost);
            } else if (methodName.equals("addChangeListener") || methodName.equals("removeChangeListener")) {
                // 配置监听操作结果
                handler.afterListenerOperation(className, methodName, allArguments, result, t, target, cost);
            } else if (methodName.equals("fireConfigChange")) {
                // 配置变更通知结果
                handler.afterConfigChange(className, methodName, allArguments, result, t, target, cost);
            } else if (className.contains("ConfigRepository") && (methodName.equals("loadConfig") || methodName.equals("fetchConfig") || methodName.equals("sync"))) {
                // 配置加载/同步结果
                handler.afterConfigLoad(className, methodName, allArguments, result, t, target, cost);
            }
        } finally {
            CURRENT_ARGS.remove();
            START_TIME.remove();
        }
    }
}
