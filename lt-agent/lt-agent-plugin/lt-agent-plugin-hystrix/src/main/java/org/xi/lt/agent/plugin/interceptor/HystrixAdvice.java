package org.xi.lt.agent.plugin.interceptor;

import com.netflix.hystrix.HystrixCommand;
import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.hystrix.handler.HystrixHandler;

/**
 * Hystrix方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class HystrixAdvice {
    private static HystrixHandler handler = new HystrixHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            CURRENT_ARGS.set(allArguments);
            if (target instanceof HystrixCommand) {
                HystrixCommand command = (HystrixCommand) target;
                if (methodName.equals("run")) {
                    // 执行业务逻辑
                    handler.beforeRun(command, className, methodName, allArguments);
                } else if (methodName.equals("getFallback")) {
                    // 执行降级逻辑
                    handler.beforeFallback(command, className, methodName, allArguments);
                } else if (methodName.equals("execute") || methodName.equals("queue")) {
                    // 命令执行入口
                    handler.beforeExecute(command, className, methodName, allArguments);
                }
            } else if (className.contains("HystrixCircuitBreakerImpl")) {
                // 熔断器状态变化
                handler.beforeCircuitBreakerAction(methodName, target);
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
            if (target instanceof HystrixCommand) {
                HystrixCommand command = (HystrixCommand) target;
                if (methodName.equals("run")) {
                    // 业务逻辑执行结果
                    handler.afterRun(command, className, methodName, allArguments, result, t);
                } else if (methodName.equals("getFallback")) {
                    // 降级逻辑执行结果
                    handler.afterFallback(command, className, methodName, allArguments, result, t);
                } else if (methodName.equals("execute") || methodName.equals("queue")) {
                    // 命令执行结果
                    handler.afterExecute(command, className, methodName, allArguments, result, t);
                }
            } else if (className.contains("HystrixCircuitBreakerImpl")) {
                // 熔断器状态变化结果
                handler.afterCircuitBreakerAction(methodName, target, result, t);
            }
        } finally {
            CURRENT_ARGS.remove();
        }
    }
}
