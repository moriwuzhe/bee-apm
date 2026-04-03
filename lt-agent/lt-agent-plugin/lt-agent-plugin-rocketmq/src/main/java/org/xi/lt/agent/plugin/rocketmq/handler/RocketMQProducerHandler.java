package org.xi.lt.agent.plugin.rocketmq.handler;

import org.apache.rocketmq.common.message.Message;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.List;

/**
 * RocketMQ生产者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RocketMQProducerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("RocketMQProducerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建RocketMQ发送Span
            Span span = SpanManager.createEntrySpan("mq_produce");
            
            // 提取消息对象
            Object msgObj = allArguments[0];
            if (msgObj instanceof Message) {
                Message msg = (Message) msgObj;
                span.addTag("topic", msg.getTopic());
                span.addTag("tags", msg.getTags());
                span.addTag("keys", msg.getKeys());
                span.addTag("body_length", String.valueOf(msg.getBody() != null ? msg.getBody().length : 0));
            } else if (msgObj instanceof List) {
                // 批量发送的情况
                List<?> msgList = (List<?>) msgObj;
                if (!msgList.isEmpty() && msgList.get(0) instanceof Message) {
                    Message firstMsg = (Message) msgList.get(0);
                    span.addTag("topic", firstMsg.getTopic());
                    span.addTag("batch_size", String.valueOf(msgList.size()));
                }
            }
            
            // 采集生产者实例信息
            Object producer = extVal[0];
            try {
                Field namesrvAddrField = producer.getClass().getDeclaredField("namesrvAddr");
                namesrvAddrField.setAccessible(true);
                String namesrvAddr = (String) namesrvAddrField.get(producer);
                span.addTag("namesrv_addr", namesrvAddr);
            } catch (Exception e) {
                // 忽略反射获取异常
            }
            
            return span;
        } catch (Exception e) {
            log.error("RocketMQProducerHandler before error", e);
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
            log.error("RocketMQProducerHandler after error", e);
            return result;
        }
    }
}
