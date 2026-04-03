package org.xi.lt.agent.plugin.kafka;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.KafkaAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Kafka消息队列埋点插件
 * 支持Kafka Clients 2.x/3.x版本，覆盖Producer发送和Consumer消费两端
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "kafka")
public class KafkaPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "kafka";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截Producer发送消息方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.apache.kafka.clients.producer.KafkaProducer")
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("send")
                                .and(takesArguments(1).or(takesArguments(2)))
                                .and(not(isStatic()));
                    }
                },
                // 拦截Consumer消费消息方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.apache.kafka.clients.consumer.KafkaConsumer")
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("poll")
                                .and(takesArguments(1))
                                .and(not(isStatic()));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return KafkaAdvice.class;
    }
}
