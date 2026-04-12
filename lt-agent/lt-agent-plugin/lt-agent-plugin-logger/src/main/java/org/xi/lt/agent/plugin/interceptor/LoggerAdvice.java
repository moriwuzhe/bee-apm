package org.xi.lt.agent.plugin.interceptor;

import org.xi.lt.agent.plugin.handler.HandlerLoader;
import org.xi.lt.agent.plugin.handler.IHandler;
import net.bytebuddy.asm.Advice;

/**
 * @author yuan
 * @date 2018/8/19
 */
public class LoggerAdvice {
    @Advice.OnMethodEnter()
    public static void enter(@Advice.Origin("#t") String className,
                             @Advice.Origin("#m") String methodName,
                             @Advice.AllArguments(readOnly = false, typing = net.bytebuddy.implementation.bytecode.assign.Assigner.Typing.DYNAMIC) Object[] allParams,
                             @Advice.FieldValue("name") String name) {
        IHandler handler = HandlerLoader.load("org.xi.lt.agent.plugin.handler.LoggerHandler");
        StackTraceElement[] stacks = Thread.currentThread().getStackTrace();
        String pointMethod = stacks[2].getMethodName();
        handler.before(className, methodName, allParams, new String[]{name, pointMethod});
    }
}
