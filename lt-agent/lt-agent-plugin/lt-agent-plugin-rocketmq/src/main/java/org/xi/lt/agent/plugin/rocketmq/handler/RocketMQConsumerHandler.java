package org.xi.lt.agent.plugin.rocketmq.handler;

import org.apache.rocketmq.common.message.MessageExt;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.util.List;

/**
 * RocketMQ消费者端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RocketMQConsumerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("RocketMQConsumerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建RocketMQ消费Span
            Span span = SpanManager.createEntrySpan("mq_consume");
            
            // 提取消息列表
            Object msgListObj = allArguments[0];
            if (msgListObj instanceof List) {
                List<?> msgList = (List<?>) msgListObj;
                if (!msgList.isEmpty() && msgList.get(0) instanceof MessageExt) {
                    MessageExt msg = (MessageExt) msgList.get(0);
                    span.addTag("topic", msg.getTopic());
                    span.addTag("tags", msg.getTags());
                    span.addTag("keys", msg.getKeys());
                    span.addTag("queue_id", String.valueOf(msg.getQueueId()));
                    span.addTag("reconsume_times", String.valueOf(msg.getReconsumeTimes()));
                    span.addTag("born_time", String.valueOf(msg.getBornTimestamp()));
                    span.addTag("store_time", String.valueOf(msg.getStoreTimestamp()));
                    span.addTag("batch_size", String.valueOf(msgList.size()));
                    
                    // 尝试从消息属性中获取上游链路信息
                    String traceId = msg.getUserProperty("traceId");
                    String parentSpanId = msg.getUserProperty("spanId");
                    if (traceId != null) {
                        BeeTraceContext.setGId(traceId);
                    }
                    if (parentSpanId != null) {
                        BeeTraceContext.setPId(parentSpanId);
                    }
                }
            }
            
            return span;
        } catch (Exception e) {
            log.error("RocketMQConsumerHandler before error", e);
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
                
                // 处理异常和消费结果
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                    span.addTag("consume_result", "exception");
                } else if (result != null) {
                    // 消费成功或失败
                    String resultStr = result.toString();
                    if (resultStr.contains("RECONSUME_LATER")) {
                        span.addTag("consume_result", "reconsume_later");
                    } else if (resultStr.contains("SUCCESS")) {
                        span.addTag("consume_result", "success");
                    } else {
                        span.addTag("consume_result", resultStr);
                    }
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("RocketMQConsumerHandler after error", e);
            return result;
        }
    }
}
