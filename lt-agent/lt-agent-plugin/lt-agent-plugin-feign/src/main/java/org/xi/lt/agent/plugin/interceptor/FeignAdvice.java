package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.feign.handler.FeignHandler;

/**
 * Feign方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class FeignAdvice {
    private static FeignHandler handler = new FeignHandler();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            Object[] extVal = new Object[]{target};
            handler.before(className, methodName, allArguments, extVal);
        } catch (Exception e) {
            // 异常不影响业务
        }
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void onExit(
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.Return(readOnly = false, typing = net.bytebuddy.implementation.bytecode.assign.Assigner.Typing.DYNAMIC) Object result,
            @Advice.Thrown Throwable t,
            @Advice.AllArguments Object[] allArguments) {
        try {
            handler.after(className, methodName, allArguments, result, t, null);
        } catch (Exception e) {
            // 异常不影响业务
        }
    }
}
