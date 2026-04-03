package org.xi.lt.agent.plugin.interceptor;

import com.xxl.job.core.handler.IJobHandler;
import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.xxljob.handler.XxlJobHandler;

/**
 * XXL-Job方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class XxlJobAdvice {
    private static XxlJobHandler handler = new XxlJobHandler();
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
            
            if ((target instanceof IJobHandler || className.contains("MethodJobHandler")) && methodName.equals("execute")) {
                // 任务执行
                handler.beforeJobExecute(className, methodName, allArguments, target);
            } else if (className.contains("XxlJobExecutor") && (methodName.equals("start") || methodName.equals("destroy") || methodName.equals("registerJobHandler"))) {
                // 执行器操作
                handler.beforeExecutorOperation(className, methodName, allArguments, target);
            } else if (className.contains("AdminBizClient") && methodName.equals("callback")) {
                // 任务回调
                handler.beforeCallback(className, methodName, allArguments, target);
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
            if ((target instanceof IJobHandler || className.contains("MethodJobHandler")) && methodName.equals("execute")) {
                // 任务执行结果
                handler.afterJobExecute(className, methodName, allArguments, result, t, target, cost);
            } else if (className.contains("XxlJobExecutor") && (methodName.equals("start") || methodName.equals("destroy") || methodName.equals("registerJobHandler"))) {
                // 执行器操作结果
                handler.afterExecutorOperation(className, methodName, allArguments, result, t, target, cost);
            } else if (className.contains("AdminBizClient") && methodName.equals("callback")) {
                // 任务回调结果
                handler.afterCallback(className, methodName, allArguments, result, t, target, cost);
            }
        } finally {
            CURRENT_ARGS.remove();
            START_TIME.remove();
        }
    }
}
