package org.xi.lt.agent.plugin.redis.handler;

import org.xi.lt.agent.common.SpanManager;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;
import redis.clients.jedis.Jedis;

import java.util.Arrays;

/**
 * Redis调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class RedisHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("RedisHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            Jedis jedis = (Jedis) extVal[0];
            
            // 创建Redis调用Span
            Span span = SpanManager.createEntrySpan("redis");
            
            // 采集Redis服务器地址
            String host = jedis.getClient().getHost();
            int port = jedis.getClient().getPort();
            
            span.addTag("command", methodName.toUpperCase());
            span.addTag("host", host);
            span.addTag("port", String.valueOf(port));
            
            // 采集key和参数
            if (allArguments != null && allArguments.length > 0) {
                span.addTag("key", String.valueOf(allArguments[0]));
                if (allArguments.length > 1) {
                    span.addTag("args", Arrays.toString(Arrays.copyOfRange(allArguments, 1, allArguments.length)));
                }
            }
            
            return span;
        } catch (Exception e) {
            log.error("RedisHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("redis")) {
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
            log.error("RedisHandler after error", e);
            return result;
        }
    }
}
