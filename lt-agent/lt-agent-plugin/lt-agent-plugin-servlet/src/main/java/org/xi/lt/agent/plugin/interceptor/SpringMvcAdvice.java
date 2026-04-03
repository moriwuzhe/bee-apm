package org.xi.lt.agent.plugin.interceptor;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.HandlerLoader;
import org.xi.lt.agent.plugin.handler.IHandler;
import net.bytebuddy.asm.Advice;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Spring MVC Controller拦截器
 * 适配Controller方法不一定带HttpServletRequest/HttpServletResponse参数的场景
 * @author LT Monitor Dev
 * @date 2026/04/02
 */
public class SpringMvcAdvice {
    @Advice.OnMethodEnter()
    public static Span enter(@Advice.Local("handler") IHandler handler,
                             @Advice.Origin("#t") String className,
                             @Advice.Origin("#m") String methodName) {
        handler = HandlerLoader.load("org.xi.lt.agent.plugin.handler.ServletHandler");
        try {
            // 从Spring上下文获取当前请求
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                HttpServletResponse response = attributes.getResponse();
                if (request != null && response != null) {
                    return handler.before(className, methodName, new Object[]{request, response}, null);
                }
            }
        } catch (Exception e) {
            // 忽略异常，不影响业务方法执行
        }
        return null;
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void exit(@Advice.Local("handler") IHandler handler,
                            @Advice.Origin("#t") String className,
                            @Advice.Origin("#m") String methodName,
                            @Advice.Return Object result,
                            @Advice.Thrown Throwable t) {
        if (handler == null) {
            return;
        }
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                HttpServletResponse response = attributes.getResponse();
                if (request != null && response != null) {
                    handler.after(className, methodName, new Object[]{request, response}, result, t, null);
                }
            }
        } catch (Exception e) {
            // 忽略异常，不影响业务方法执行
        }
    }

}
