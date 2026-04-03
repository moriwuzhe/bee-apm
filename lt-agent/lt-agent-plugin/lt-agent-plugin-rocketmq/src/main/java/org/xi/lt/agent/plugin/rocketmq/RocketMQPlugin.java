package org.xi.lt.agent.plugin.rocketmq;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.RocketMQAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * RocketMQ消息队列埋点插件
 * 支持RocketMQ 4.x版本，覆盖生产者发送和消费者消费两端
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "rocketmq")
public class RocketMQPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "rocketmq";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截生产者发送消息方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("org.apache.rocketmq.client.producer.MQProducer"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("send")
                                .and(takesArguments(1).or(takesArguments(2)).or(takesArguments(3)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截消费者消费消息方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("org.apache.rocketmq.client.consumer.listener.MessageListener"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("consumeMessage")
                                .and(takesArguments(1))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return RocketMQAdvice.class;
    }
}
