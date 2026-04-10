package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.springframework.web.server.ServerWebExchange;
import org.xi.lt.agent.plugin.gateway.handler.GatewayHandler;
import reactor.core.publisher.Mono;

/**
 * Spring Cloud Gateway方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class GatewayAdvice {
    private static GatewayHandler handler = new GatewayHandler();

    @Advice.OnMethodExit
    public static void onExit(
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.Return(readOnly = false, typing = net.bytebuddy.implementation.bytecode.assign.Assigner.Typing.DYNAMIC) Object result,
            @Advice.AllArguments Object[] allArguments) {
        try {
            if (result instanceof Mono && allArguments.length > 0 && allArguments[0] instanceof ServerWebExchange) {
                ServerWebExchange exchange = (ServerWebExchange) allArguments[0];
                Mono<?> mono = (Mono<?>) result;
                
                // 处理响应式调用，在订阅时创建Span，在结束时上报
                result = mono
                        .doOnSubscribe(subscription -> handler.before(className, methodName, allArguments, new Object[]{exchange}))
                        .doOnSuccess(o -> handler.after(className, methodName, allArguments, o, null, new Object[]{exchange}))
                        .doOnError(t -> handler.after(className, methodName, allArguments, null, t, new Object[]{exchange}));
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }
}
