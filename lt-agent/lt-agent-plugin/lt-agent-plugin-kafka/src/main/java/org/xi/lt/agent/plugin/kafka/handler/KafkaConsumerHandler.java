package org.xi.lt.agent.plugin.kafka.handler;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.header.Header;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.nio.charset.StandardCharsets;
import java.util.Iterator;

/**
 * Kafka消费者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class KafkaConsumerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("KafkaConsumerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建Kafka消费Span（会在after方法里填充信息）
            Span span = SpanManager.createEntrySpan("mq_consume");
            span.addTag("mq_type", "kafka");
            return span;
        } catch (Exception e) {
            log.error("KafkaConsumerHandler before error", e);
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
                } else if (result instanceof ConsumerRecords) {
                    ConsumerRecords<?, ?> records = (ConsumerRecords<?, ?>) result;
                    int count = records.count();
                    span.addTag("consume_count", String.valueOf(count));
                    
                    if (count > 0) {
                        // 取第一条消息提取公共信息
                        Iterator<? extends ConsumerRecord<?, ?>> iterator = records.iterator();
                        if (iterator.hasNext()) {
                            ConsumerRecord<?, ?> record = iterator.next();
                            
                            span.addTag("topic", record.topic());
                            span.addTag("partition", String.valueOf(record.partition()));
                            span.addTag("offset", String.valueOf(record.offset()));
                            
                            // 从消息头中获取链路信息
                            Header traceIdHeader = record.headers().lastHeader("traceId");
                            Header spanIdHeader = record.headers().lastHeader("spanId");
                            if (traceIdHeader != null) {
                                String traceId = new String(traceIdHeader.value(), StandardCharsets.UTF_8);
                                BeeTraceContext.setGId(traceId);
                            }
                            if (spanIdHeader != null) {
                                String spanId = new String(spanIdHeader.value(), StandardCharsets.UTF_8);
                                BeeTraceContext.setPId(spanId);
                            }
                        }
                    }
                    
                    span.addTag("consume_result", "success");
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("KafkaConsumerHandler after error", e);
            return result;
        }
    }
}
