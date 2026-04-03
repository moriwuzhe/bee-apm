package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.seata.handler.SeataHandler;

/**
 * Seata方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class SeataAdvice {
    private static SeataHandler handler = new SeataHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            CURRENT_ARGS.set(allArguments);
            if (methodName.equals("begin") && className.contains("DefaultGlobalTransaction")) {
                // 全局事务开始
                handler.beforeGlobalBegin(className, methodName, allArguments, new Object[]{target});
            } else if ((methodName.equals("commit") || methodName.equals("rollback")) && className.contains("DefaultGlobalTransaction")) {
                // 全局事务提交/回滚
                handler.beforeGlobalFinish(className, methodName, allArguments, new Object[]{target});
            } else if ((methodName.equals("execute") || methodName.equals("prepare")) && (className.contains("AbstractDMLBaseExecutor") || className.contains("BusinessActionContext"))) {
                // 分支事务执行
                handler.beforeBranchExecute(className, methodName, allArguments, new Object[]{target});
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
            @Advice.AllArguments Object[] allArguments) {
        try {
            if (methodName.equals("begin") && className.contains("DefaultGlobalTransaction")) {
                // 全局事务开始结果
                handler.afterGlobalBegin(className, methodName, allArguments, result, t, new Object[]{CURRENT_ARGS.get()});
            } else if ((methodName.equals("commit") || methodName.equals("rollback")) && className.contains("DefaultGlobalTransaction")) {
                // 全局事务提交/回滚结果
                handler.afterGlobalFinish(className, methodName, allArguments, result, t, new Object[]{CURRENT_ARGS.get()});
            } else if ((methodName.equals("execute") || methodName.equals("prepare")) && (className.contains("AbstractDMLBaseExecutor") || className.contains("BusinessActionContext"))) {
                // 分支事务执行结果
                handler.afterBranchExecute(className, methodName, allArguments, result, t, new Object[]{CURRENT_ARGS.get()});
            }
        } finally {
            CURRENT_ARGS.remove();
        }
    }
}
