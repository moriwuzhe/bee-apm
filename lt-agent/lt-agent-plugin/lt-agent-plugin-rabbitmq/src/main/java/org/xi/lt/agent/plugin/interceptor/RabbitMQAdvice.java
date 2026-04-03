package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.rabbitmq.handler.RabbitMQConsumerHandler;
import org.xi.lt.agent.plugin.rabbitmq.handler.RabbitMQProducerHandler;

/**
 * RabbitMQ方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RabbitMQAdvice {
    private static RabbitMQProducerHandler producerHandler = new RabbitMQProducerHandler();
    private static RabbitMQConsumerHandler consumerHandler = new RabbitMQConsumerHandler();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            Object[] extVal = new Object[]{target};
            // 判断是生产者还是消费者
            if (methodName.equals("basicPublish")) {
                // 生产者发送消息
                producerHandler.before(className, methodName, allArguments, extVal);
            } else if (methodName.equals("onMessage") || methodName.equals("handleDelivery")) {
                // 消费者消费消息
                consumerHandler.before(className, methodName, allArguments, extVal);
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
            // 判断是生产者还是消费者
            if (methodName.equals("basicPublish")) {
                // 生产者发送消息
                producerHandler.after(className, methodName, allArguments, result, t, null);
            } else if (methodName.equals("onMessage") || methodName.equals("handleDelivery")) {
                // 消费者消费消息
                consumerHandler.after(className, methodName, allArguments, result, t, null);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }
}
