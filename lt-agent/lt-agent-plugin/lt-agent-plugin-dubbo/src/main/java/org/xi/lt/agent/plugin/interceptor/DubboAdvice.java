package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.Invoker;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.dubbo.handler.DubboConsumerHandler;
import org.xi.lt.agent.plugin.dubbo.handler.DubboProviderHandler;

/**
 * Dubbo统一拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class DubboAdvice {
    private static DubboProviderHandler providerHandler = new DubboProviderHandler();
    private static DubboConsumerHandler consumerHandler = new DubboConsumerHandler();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            Invoker<?> invoker = (Invoker<?>) target;
            Object[] extVal = new Object[]{target};
            
            // 判断是Provider还是Consumer
            if (className.contains("Consumer")) {
                // Consumer端
                consumerHandler.before(className, methodName, allArguments, extVal);
            } else {
                // Provider端
                providerHandler.before(className, methodName, allArguments, extVal);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void onExit(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.Return Object result,
            @Advice.Thrown Throwable t,
            @Advice.AllArguments Object[] allArguments) {
        try {
            // 判断是Provider还是Consumer
            if (className.contains("Consumer")) {
                // Consumer端
                consumerHandler.after(className, methodName, allArguments, result, t, null);
            } else {
                // Provider端
                providerHandler.after(className, methodName, allArguments, result, t, null);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }
}
