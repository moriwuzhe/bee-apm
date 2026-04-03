package org.xi.lt.agent.plugin.seata.handler;

import io.seata.core.context.RootContext;
import io.seata.tm.api.GlobalTransaction;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Seata分布式事务拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class SeataHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("SeataHandler");
    private static final ThreadLocal<Span> GLOBAL_SPAN = new ThreadLocal<>();
    private static final ThreadLocal<Span> BRANCH_SPAN = new ThreadLocal<>();

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Seata的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Seata的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 全局事务开始前
     */
    public void beforeGlobalBegin(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建全局事务Span
            Span span = SpanManager.createEntrySpan("seata_global");
            span.addTag("transaction_type", "global");
            GLOBAL_SPAN.set(span);
        } catch (Exception e) {
            log.error("SeataHandler beforeGlobalBegin error", e);
        }
    }

    /**
     * 全局事务开始后
     */
    public void afterGlobalBegin(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = GLOBAL_SPAN.get();
            if (span != null) {
                if (t != null) {
                    // 事务开启失败
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                    calculateSpend(span);
                    BeeConfig.me().fillEnvInfo(span);
                    ReporterFactory.report(span);
                    GLOBAL_SPAN.remove();
                } else {
                    // 事务开启成功
                    String xid = RootContext.getXID();
                    span.addTag("xid", xid);
                    span.addTag("status", "begin");
                    if (allArguments.length > 0 && allArguments[0] instanceof Integer) {
                        span.addTag("timeout", allArguments[0].toString());
                    }
                    if (allArguments.length > 1 && allArguments[1] instanceof String) {
                        span.addTag("transaction_name", (String) allArguments[1]);
                    }
                }
            }
        } catch (Exception e) {
            log.error("SeataHandler afterGlobalBegin error", e);
        }
    }

    /**
     * 全局事务提交/回滚前
     */
    public void beforeGlobalFinish(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            Span span = GLOBAL_SPAN.get();
            if (span != null) {
                span.addTag("action", methodName);
            }
        } catch (Exception e) {
            log.error("SeataHandler beforeGlobalFinish error", e);
        }
    }

    /**
     * 全局事务提交/回滚后
     */
    public void afterGlobalFinish(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = GLOBAL_SPAN.get();
            if (span != null) {
                calculateSpend(span);
                if (t != null) {
                    span.addTag("status", methodName + "_failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", methodName + "_success");
                }
                // 上报全局事务Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("SeataHandler afterGlobalFinish error", e);
        } finally {
            GLOBAL_SPAN.remove();
        }
    }

    /**
     * 分支事务执行前
     */
    public void beforeBranchExecute(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            String xid = RootContext.getXID();
            if (xid != null) {
                // 创建分支事务Span
                Span span = SpanManager.createEntrySpan("seata_branch");
                span.addTag("transaction_type", "branch");
                span.addTag("xid", xid);
                span.addTag("branch_type", className.contains("TCC") ? "TCC" : "AT");
                BRANCH_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("SeataHandler beforeBranchExecute error", e);
        }
    }

    /**
     * 分支事务执行后
     */
    public void afterBranchExecute(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = BRANCH_SPAN.get();
            if (span != null) {
                calculateSpend(span);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                // 上报分支事务Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("SeataHandler afterBranchExecute error", e);
        } finally {
            BRANCH_SPAN.remove();
        }
    }
}
