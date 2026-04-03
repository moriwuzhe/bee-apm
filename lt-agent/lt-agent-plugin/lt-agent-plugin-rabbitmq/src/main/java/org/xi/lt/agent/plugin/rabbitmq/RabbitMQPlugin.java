package org.xi.lt.agent.plugin.rabbitmq;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.RabbitMQAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * RabbitMQ消息队列埋点插件
 * 支持RabbitMQ Java Client 5.x版本、Spring AMQP 2.x版本
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "rabbitmq")
public class RabbitMQPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "rabbitmq";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截生产者发送消息方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("com.rabbitmq.client.Channel"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("basicPublish")
                                .and(takesArguments(4).or(takesArguments(5)).or(takesArguments(6)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截消费者消费消息方法（Spring AMQP）
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter")
                                .or(named("org.springframework.amqp.rabbit.listener.api.ChannelAwareMessageListener"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("onMessage")
                                .and(takesArguments(1).or(takesArguments(2)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截原生消费者消费方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("com.rabbitmq.client.Consumer"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("handleDelivery")
                                .and(takesArguments(4))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return RabbitMQAdvice.class;
    }
}
