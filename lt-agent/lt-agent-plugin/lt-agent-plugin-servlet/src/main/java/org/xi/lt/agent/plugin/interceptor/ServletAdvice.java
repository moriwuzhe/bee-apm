package org.xi.lt.agent.plugin.interceptor;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.common.servlet.Const;
import org.xi.lt.agent.plugin.handler.HandlerLoader;
import org.xi.lt.agent.plugin.handler.IHandler;
import net.bytebuddy.asm.Advice;
import net.bytebuddy.implementation.bytecode.assign.Assigner;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * 统一Servlet和Spring MVC拦截器
 * 兼容标准Servlet（带request/response参数）和Spring Controller（从上下文获取request/response）
 *
 * @author yuan
 * @date 2018/08/05
 */
public class ServletAdvice {
    @Advice.OnMethodEnter()
    public static void enter(@Advice.Local("handler") IHandler handler,
                             @Advice.Local("span") Span span,
                             @Advice.Origin("#t") String className,
                             @Advice.Origin("#m") String methodName,
                             @Advice.AllArguments(readOnly = false, typing = Assigner.Typing.DYNAMIC) Object[] args) {
        handler = HandlerLoader.load("org.xi.lt.agent.plugin.handler.ServletHandler");
        HttpServletRequest request = null;
        HttpServletResponse response = null;

        // 先尝试从参数获取request和response
        if (args != null && args.length >= 2) {
            if (args[0] instanceof HttpServletRequest && args[1] instanceof HttpServletResponse) {
                request = (HttpServletRequest) args[0];
                response = (HttpServletResponse) args[1];
            }
        }

        if (request == null || response == null) {
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    request = attributes.getRequest();
                    response = attributes.getResponse();
                }
            } catch (Throwable e) {
                // Ignore
            }
        }

        if (request != null && response != null) {
            try {
                span = handler.before(className, methodName, new Object[]{request, response}, null);
                if (span != null) {
                    if (span.getTag(Const.KEY_RESP_WRAPPER) != null && args.length >= 2 && args[1] instanceof HttpServletResponse) {
                        //修改resp参数
                        args[1] = span.getTag(Const.KEY_RESP_WRAPPER);
                    }
                    span.removeTag(Const.KEY_RESP_WRAPPER);

                    if (span.getTag(Const.KEY_REQ_WRAPPER) != null && args.length >= 1 && args[0] instanceof HttpServletRequest) {
                        //修改req参数
                        args[0] = span.getTag(Const.KEY_REQ_WRAPPER);
                    }
                    span.removeTag(Const.KEY_REQ_WRAPPER);
                }
            } catch (Throwable e) {
                // Ignore
            }
        }
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    public static void exit(@Advice.Local("handler") IHandler handler,
                            @Advice.Local("span") Span span,
                            @Advice.Origin("#t") String className,
                            @Advice.Origin("#m") String methodName,
                            @Advice.AllArguments Object[] args,
                            @Advice.Return(typing = Assigner.Typing.DYNAMIC) Object result,
                            @Advice.Thrown Throwable t) {
        if (handler == null) {
            return;
        }

        HttpServletRequest request = null;
        HttpServletResponse response = null;

        // 先尝试从参数获取request和response
        if (args != null && args.length >= 2) {
            if (args[0] instanceof HttpServletRequest && args[1] instanceof HttpServletResponse) {
                request = (HttpServletRequest) args[0];
                response = (HttpServletResponse) args[1];
            }
        }

        if (request == null || response == null) {
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    request = attributes.getRequest();
                    response = attributes.getResponse();
                }
            } catch (Throwable e) {
                // Ignore
            }
        }

        if (request != null && response != null) {
            try {
                handler.after(className, methodName, new Object[]{request, response}, result, t, new Object[]{span});
            } catch (Throwable e) {
                // Ignore
            }
        }
    }

}
