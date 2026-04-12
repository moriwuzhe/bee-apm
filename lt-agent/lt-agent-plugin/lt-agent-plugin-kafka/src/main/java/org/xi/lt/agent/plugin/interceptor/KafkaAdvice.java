package org.xi.lt.agent.plugin.interceptor;

import net.bytebuddy.asm.Advice;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.kafka.handler.KafkaConsumerHandler;
import org.xi.lt.agent.plugin.kafka.handler.KafkaProducerHandler;

/**
 * Kafka方法拦截Advice
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class KafkaAdvice {
    private static KafkaProducerHandler producerHandler = new KafkaProducerHandler();
    private static KafkaConsumerHandler consumerHandler = new KafkaConsumerHandler();

    @Advice.OnMethodEnter
    public static void onEnter(
            @Advice.This Object target,
            @Advice.Origin("#m") String methodName,
            @Advice.Origin("#t") String className,
            @Advice.AllArguments Object[] allArguments) {
        try {
            Object[] extVal = new Object[]{target};
            // 判断是生产者还是消费者
            if (methodName.equals("send") && className.contains("KafkaProducer")) {
                // 生产者发送消息
                producerHandler.before(className, methodName, allArguments, extVal);
            } else if (methodName.equals("poll") && className.contains("KafkaConsumer")) {
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
            @Advice.Return(readOnly = false, typing = net.bytebuddy.implementation.bytecode.assign.Assigner.Typing.DYNAMIC) Object result,
            @Advice.Thrown Throwable t,
            @Advice.AllArguments Object[] allArguments) {
        try {
            // 判断是生产者还是消费者
            if (methodName.equals("send") && className.contains("KafkaProducer")) {
                // 生产者发送消息
                producerHandler.after(className, methodName, allArguments, result, t, null);
            } else if (methodName.equals("poll") && className.contains("KafkaConsumer")) {
                // 消费者消费消息
                consumerHandler.after(className, methodName, allArguments, result, t, null);
            }
        } catch (Exception e) {
            // 异常不影响业务
        }
    }
}
