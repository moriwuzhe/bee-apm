package org.xi.lt.agent.plugin.rabbitmq.handler;

import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Envelope;
import org.springframework.amqp.core.Message;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.util.Map;

/**
 * RabbitMQ消费者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RabbitMQConsumerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("RabbitMQConsumerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建RabbitMQ消费Span
            Span span = SpanManager.createEntrySpan("mq_consume");
            
            span.addTag("mq_type", "rabbitmq");
            
            // 处理不同类型的消费方法
            if (methodName.equals("handleDelivery")) {
                // 原生Consumer的handleDelivery方法
                String consumerTag = (String) allArguments[0];
                Envelope envelope = (Envelope) allArguments[1];
                AMQP.BasicProperties properties = (AMQP.BasicProperties) allArguments[2];
                byte[] body = (byte[]) allArguments[3];
                
                span.addTag("exchange", envelope.getExchange());
                span.addTag("routing_key", envelope.getRoutingKey());
                span.addTag("delivery_tag", String.valueOf(envelope.getDeliveryTag()));
                span.addTag("redeliver", String.valueOf(envelope.isRedeliver()));
                span.addTag("body_length", String.valueOf(body != null ? body.length : 0));
                
                // 从消息头中获取链路信息
                if (properties != null && properties.getHeaders() != null) {
                    Map<String, Object> headers = properties.getHeaders();
                    String traceId = (String) headers.get("traceId");
                    String spanId = (String) headers.get("spanId");
                    if (traceId != null) {
                        BeeTraceContext.setGId(traceId);
                    }
                    if (spanId != null) {
                        BeeTraceContext.setPId(spanId);
                    }
                }
            } else if (methodName.equals("onMessage")) {
                // Spring AMQP的onMessage方法
                Message message = (Message) allArguments[0];
                span.addTag("exchange", message.getMessageProperties().getReceivedExchange());
                span.addTag("routing_key", message.getMessageProperties().getReceivedRoutingKey());
                span.addTag("delivery_tag", String.valueOf(message.getMessageProperties().getDeliveryTag()));
                span.addTag("redeliver", String.valueOf(message.getMessageProperties().isRedelivered()));
                span.addTag("body_length", String.valueOf(message.getBody() != null ? message.getBody().length : 0));
                span.addTag("queue", message.getMessageProperties().getConsumerQueue());
                
                // 从消息头中获取链路信息
                Map<String, Object> headers = message.getMessageProperties().getHeaders();
                if (headers != null) {
                    String traceId = (String) headers.get("traceId");
                    String spanId = (String) headers.get("spanId");
                    if (traceId != null) {
                        BeeTraceContext.setGId(traceId);
                    }
                    if (spanId != null) {
                        BeeTraceContext.setPId(spanId);
                    }
                }
            }
            
            return span;
        } catch (Exception e) {
            log.error("RabbitMQConsumerHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("mq_consume")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                    span.addTag("consume_result", "exception");
                } else {
                    span.addTag("consume_result", "success");
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("RabbitMQConsumerHandler after error", e);
            return result;
        }
    }
}
