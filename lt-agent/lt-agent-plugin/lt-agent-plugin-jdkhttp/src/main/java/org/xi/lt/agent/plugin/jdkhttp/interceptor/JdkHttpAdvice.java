package org.xi.lt.agent.plugin.jdkhttp.interceptor;

import org.xi.lt.agent.plugin.handler.HandlerLoader;
import org.xi.lt.agent.plugin.handler.IHandler;
import net.bytebuddy.asm.Advice;

public class JdkHttpAdvice {

    @Advice.OnMethodEnter()
    public static void enter(@Advice.Local("handler") IHandler handler,
                             @Advice.Origin("#t") String className,
                             @Advice.Origin("#m") String methodName,
                             @Advice.This Object target,
                             @Advice.AllArguments Object[] args) {
        handler = HandlerLoader.load("org.xi.lt.agent.plugin.jdkhttp.handler.JdkHttpHandler");
        handler.before(className, methodName, args, new Object[]{target});
    }
}
