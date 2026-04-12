package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.plugin.nacos.handler.NacosHandler;

/**
 * Nacos方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class NacosAdvice {
    private static NacosHandler handler = new NacosHandler();
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
            
            if (className.contains("ConfigService")) {
                // 配置相关操作
                if (methodName.startsWith("getConfig") || methodName.startsWith("queryConfig")) {
                    // 拉取配置
                    handler.beforeGetConfig(className, methodName, allArguments, target);
                } else if (methodName.equals("addListener") || methodName.equals("removeListener")) {
                    // 配置监听
                    handler.beforeListenerOperation(className, methodName, allArguments, target);
                } else if (methodName.equals("receiveConfigInfo")) {
                    // 配置变更通知
                    handler.beforeConfigChange(className, methodName, allArguments, target);
                }
            } else if (className.contains("NamingService")) {
                // 服务注册发现相关操作
                if (methodName.equals("registerInstance") || methodName.equals("deregisterInstance")) {
                    // 服务注册/注销
                    handler.beforeServiceRegister(className, methodName, allArguments, target);
                } else if (methodName.startsWith("get") || methodName.startsWith("select")) {
                    // 服务发现
                    handler.beforeServiceDiscovery(className, methodName, allArguments, target);
                } else if (methodName.equals("subscribe") || methodName.equals("unsubscribe")) {
                    // 服务订阅
                    handler.beforeServiceSubscribe(className, methodName, allArguments, target);
                }
            }
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
            @Advice.AllArguments Object[] allArguments,
            @Advice.This Object target) {
        try {
            long cost = System.currentTimeMillis() - START_TIME.get();
            if (className.contains("ConfigService")) {
                // 配置相关操作结果
                if (methodName.startsWith("getConfig") || methodName.startsWith("queryConfig")) {
                    // 拉取配置结果
                    handler.afterGetConfig(className, methodName, allArguments, result, t, target, cost);
                } else if (methodName.equals("addListener") || methodName.equals("removeListener")) {
                    // 配置监听结果
                    handler.afterListenerOperation(className, methodName, allArguments, result, t, target, cost);
                } else if (methodName.equals("receiveConfigInfo")) {
                    // 配置变更通知结果
                    handler.afterConfigChange(className, methodName, allArguments, result, t, target, cost);
                }
            } else if (className.contains("NamingService")) {
                // 服务注册发现相关操作结果
                if (methodName.equals("registerInstance") || methodName.equals("deregisterInstance")) {
                    // 服务注册/注销结果
                    handler.afterServiceRegister(className, methodName, allArguments, result, t, target, cost);
                } else if (methodName.startsWith("get") || methodName.startsWith("select")) {
                    // 服务发现结果
                    handler.afterServiceDiscovery(className, methodName, allArguments, result, t, target, cost);
                } else if (methodName.equals("subscribe") || methodName.equals("unsubscribe")) {
                    // 服务订阅结果
                    handler.afterServiceSubscribe(className, methodName, allArguments, result, t, target, cost);
                }
            }
        } finally {
            CURRENT_ARGS.remove();
            START_TIME.remove();
        }
    }
}
