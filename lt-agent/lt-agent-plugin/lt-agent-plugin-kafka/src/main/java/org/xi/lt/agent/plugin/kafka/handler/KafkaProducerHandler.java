package org.xi.lt.agent.plugin.kafka.handler;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.Headers;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.nio.charset.StandardCharsets;

/**
 * Kafka生产者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class KafkaProducerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("KafkaProducerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建Kafka发送Span
            Span span = SpanManager.createEntrySpan("mq_produce");
            
            span.addTag("mq_type", "kafka");
            
            // 获取ProducerRecord
            if (allArguments != null && allArguments.length > 0 && allArguments[0] instanceof ProducerRecord) {
                ProducerRecord<?, ?> record = (ProducerRecord<?, ?>) allArguments[0];
                
                span.addTag("topic", record.topic());
                if (record.partition() != null) {
                    span.addTag("partition", String.valueOf(record.partition()));
                }
                if (record.key() != null) {
                    span.addTag("key", record.key().toString());
                }
                if (record.value() != null) {
                    span.addTag("value_length", String.valueOf(record.value().toString().length()));
                }
                
                // 将链路信息添加到消息头
                Headers headers = record.headers();
                String traceId = SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getGid() : IdHelper.id();
                String spanId = SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getId() : IdHelper.id();
                String sourceApp = LtConfig.me().getApp();
                headers.add("traceId", traceId.getBytes(StandardCharsets.UTF_8));
                headers.add("spanId", spanId.getBytes(StandardCharsets.UTF_8));
                headers.add("sourceApp", sourceApp.getBytes(StandardCharsets.UTF_8));
            }
            
            // 尝试获取集群地址
            Object producer = extVal[0];
            try {
                // 可以反射获取bootstrap.servers配置
            } catch (Exception e) {
                // 忽略反射获取异常
            }
            
            return span;
        } catch (Exception e) {
            log.error("KafkaProducerHandler before error", e);
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
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("KafkaProducerHandler after error", e);
            return result;
        }
    }
}
