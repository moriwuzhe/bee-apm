package org.xi.lt.agent.plugin.rabbitmq.handler;

import com.rabbitmq.client.AMQP;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.Map;

/**
 * RabbitMQ生产者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RabbitMQProducerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("RabbitMQProducerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建RabbitMQ发送Span
            Span span = SpanManager.createEntrySpan("mq_produce");
            
            // basicPublish参数：exchange, routingKey, mandatory, immediate, props, body
            String exchange = (String) allArguments[0];
            String routingKey = (String) allArguments[1];
            byte[] body = (byte[]) allArguments[5];
            
            span.addTag("mq_type", "rabbitmq");
            span.addTag("exchange", exchange);
            span.addTag("routing_key", routingKey);
            span.addTag("body_length", String.valueOf(body != null ? body.length : 0));
            
            // 尝试从属性中获取或者添加链路ID
            AMQP.BasicProperties props = (AMQP.BasicProperties) allArguments[4];
            if (props != null) {
                Map<String, Object> headers = props.getHeaders();
                if (headers != null) {
                    // 传递链路信息到消息头
                    headers.put("traceId", SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getGid() : IdHelper.id());
                    headers.put("spanId", SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getId() : IdHelper.id());
                }
                span.addTag("content_type", props.getContentType());
                span.addTag("delivery_mode", String.valueOf(props.getDeliveryMode()));
            }
            
            // 尝试获取连接信息
            Object channel = extVal[0];
            try {
                Field connField = channel.getClass().getDeclaredField("connection");
                connField.setAccessible(true);
                Object connection = connField.get(channel);
                if (connection != null) {
                    Field addressField = connection.getClass().getDeclaredField("address");
                    addressField.setAccessible(true);
                    Object address = addressField.get(connection);
                    span.addTag("broker_address", address.toString());
                }
            } catch (Exception e) {
                // 忽略反射获取异常
            }
            
            return span;
        } catch (Exception e) {
            log.error("RabbitMQProducerHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("mq_produce")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("RabbitMQProducerHandler after error", e);
            return result;
        }
    }
}
