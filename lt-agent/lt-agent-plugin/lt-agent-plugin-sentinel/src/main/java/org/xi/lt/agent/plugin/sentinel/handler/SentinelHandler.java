package org.xi.lt.agent.plugin.sentinel.handler;

import com.alibaba.csp.sentinel.Entry;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeException;
import com.alibaba.csp.sentinel.slots.block.flow.FlowException;
import com.alibaba.csp.sentinel.slots.system.SystemBlockException;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Sentinel流量控制拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class SentinelHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("SentinelHandler");
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_RESOURCE = new ThreadLocal<>();

    /**
     * 处理流量进入
     */
    public void beforeEntry(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            if (allArguments.length > 0 && allArguments[0] instanceof String) {
                String resourceName = (String) allArguments[0];
                CURRENT_RESOURCE.set(resourceName);
                
                // 创建Sentinel流量监控Span
                Span span = SpanManager.createEntrySpan("sentinel");
                span.addTag("resource", resourceName);
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("SentinelHandler beforeEntry error", e);
        }
    }

    /**
     * 处理流量进入结果
     */
    public void afterEntry(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                if (t != null && t instanceof BlockException) {
                    // 被流量控制拦截
                    span.addTag("blocked", "true");
                    span.addTag("block_type", getBlockType(t.getClass()));
                    span.addTag("block_reason", t.getMessage());
                } else {
                    // 正常通过
                    span.addTag("blocked", "false");
                    if (result instanceof Entry) {
                        Entry entry = (Entry) result;
                        // 暂不采集entryType，不同版本API有差异
                    }
                }
            }
        } catch (Exception e) {
            log.error("SentinelHandler afterEntry error", e);
        }
    }

    /**
     * 处理流量退出前
     */
    public void beforeExit(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // 暂时不需要处理
    }

    /**
     * 处理流量退出结果
     */
    public void afterExit(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null && span.getType().equals("sentinel")) {
                // 计算耗时
                calculateSpend(span);
                
                // 上报Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("SentinelHandler afterExit error", e);
        } finally {
            CURRENT_SPAN.remove();
            CURRENT_RESOURCE.remove();
        }
    }

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Sentinel的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Sentinel的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 处理流量控制异常
     */
    public void onBlockException(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                Object exception = extVal[0];
                span.addTag("blocked", "true");
                span.addTag("block_type", getBlockType(exception.getClass()));
                if (allArguments.length > 0 && allArguments[0] instanceof String) {
                    span.addTag("block_reason", (String) allArguments[0]);
                }
            }
        } catch (Exception e) {
            log.error("SentinelHandler onBlockException error", e);
        }
    }

    /**
     * 获取流量控制类型
     */
    private String getBlockType(Class<?> exceptionClass) {
        if (FlowException.class.isAssignableFrom(exceptionClass)) {
            return "flow_control";
        } else if (DegradeException.class.isAssignableFrom(exceptionClass)) {
            return "degrade";
        } else if (SystemBlockException.class.isAssignableFrom(exceptionClass)) {
            return "system_block";
        } else if (BlockException.class.isAssignableFrom(exceptionClass)) {
            return "block";
        } else {
            return "unknown";
        }
    }
}
