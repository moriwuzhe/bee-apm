package org.xi.lt.agent.plugin.interceptor;

import com.alibaba.csp.sentinel.Entry;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.sentinel.handler.SentinelHandler;

/**
 * Sentinel方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class SentinelAdvice {
    private static SentinelHandler handler = new SentinelHandler();
    private static final ThreadLocal<Object[]> CURRENT_ARGS = new ThreadLocal<>();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This(optional = true) Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            CURRENT_ARGS.set(allArguments);
            if (methodName.equals("entry") && (className.contains("SphU") || className.contains("SphO"))) {
                // 流量进入
                handler.beforeEntry(className, methodName, allArguments, new Object[]{target});
            } else if (methodName.equals("exit") && className.contains("Entry")) {
                // 流量退出
                handler.beforeExit(className, methodName, allArguments, new Object[]{target});
            } else if (target != null && BlockException.class.isAssignableFrom(target.getClass())) {
                // 流量控制异常构造
                handler.onBlockException(className, methodName, allArguments, new Object[]{target});
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
            if (methodName.equals("entry") && (className.contains("SphU") || className.contains("SphO"))) {
                // 流量进入结果处理
                handler.afterEntry(className, methodName, allArguments, result, t, new Object[]{CURRENT_ARGS.get()});
            } else if (methodName.equals("exit") && className.contains("Entry")) {
                // 流量退出结果处理
                handler.afterExit(className, methodName, allArguments, result, t, new Object[]{CURRENT_ARGS.get()});
            }
        } finally {
            CURRENT_ARGS.remove();
        }
    }
}
