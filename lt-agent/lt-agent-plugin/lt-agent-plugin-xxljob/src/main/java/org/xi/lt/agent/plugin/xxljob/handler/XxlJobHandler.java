package org.xi.lt.agent.plugin.xxljob.handler;

import com.xxl.job.core.biz.model.HandleCallbackParam;
import com.xxl.job.core.biz.model.ReturnT;
import com.xxl.job.core.context.XxlJobContext;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.IJobHandler;
import com.xxl.job.core.handler.impl.MethodJobHandler;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.List;

/**
 * XXL-Job定时任务拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class XxlJobHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("XxlJobHandler");
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();
    private static Field methodField = null;

    static {
        try {
            methodField = MethodJobHandler.class.getDeclaredField("method");
            methodField.setAccessible(true);
        } catch (NoSuchFieldException e) {
            log.warn("Cannot get method field from MethodJobHandler", e);
        }
    }

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // XXL-Job的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // XXL-Job的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 任务执行前
     */
    public void beforeJobExecute(String className, String methodName, Object[] allArguments, Object target) {
        try {
            String jobId = null;
            String jobName = null;
            String jobParam = null;
            
            // 获取任务信息
            if (XxlJobContext.getXxlJobContext() != null) {
                jobId = String.valueOf(XxlJobContext.getXxlJobContext().getJobId());
                jobParam = XxlJobContext.getXxlJobContext().getJobParam();
            }
            
            // 获取任务名称
            if (target instanceof MethodJobHandler && methodField != null) {
                try {
                    java.lang.reflect.Method method = (java.lang.reflect.Method) methodField.get(target);
                    jobName = method.getName();
                } catch (IllegalAccessException e) {
                    log.warn("Cannot get method name from MethodJobHandler", e);
                }
            }
            
            if (jobName == null) {
                jobName = target.getClass().getSimpleName();
            }
            
            // 创建任务执行Span
            Span span = SpanManager.createEntrySpan("xxljob_execute");
            span.addTag("type", "job");
            span.addTag("action", "execute");
            if (jobId != null) {
                span.addTag("job_id", jobId);
            }
            span.addTag("job_name", jobName);
            if (jobParam != null) {
                span.addTag("job_param", jobParam);
            }
            if (allArguments.length > 0 && allArguments[0] instanceof String) {
                span.addTag("param", (String) allArguments[0]);
            }
            CURRENT_SPAN.set(span);
        } catch (Exception e) {
            log.error("XxlJobHandler beforeJobExecute error", e);
        }
    }

    /**
     * 任务执行后
     */
    public void afterJobExecute(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    // 执行异常
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                    span.addTag("handle_code", String.valueOf(ReturnT.FAIL_CODE));
                } else {
                    // 执行结果
                    if (result instanceof ReturnT) {
                        ReturnT returnT = (ReturnT) result;
                        span.addTag("status", returnT.getCode() == ReturnT.SUCCESS_CODE ? "success" : "failed");
                        span.addTag("handle_code", String.valueOf(returnT.getCode()));
                        if (returnT.getMsg() != null) {
                            span.addTag("handle_msg", returnT.getMsg());
                        }
                    } else {
                        span.addTag("status", "success");
                        span.addTag("handle_code", String.valueOf(ReturnT.SUCCESS_CODE));
                    }
                }
                // 上报Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("XxlJobHandler afterJobExecute error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 执行器操作前
     */
    public void beforeExecutorOperation(String className, String methodName, Object[] allArguments, Object target) {
        try {
            Span span = SpanManager.createEntrySpan("xxljob_executor");
            span.addTag("type", "executor");
            span.addTag("action", methodName);
            if (methodName.equals("registerJobHandler") && allArguments.length >= 2) {
                span.addTag("job_name", allArguments[0].toString());
                span.addTag("job_handler", allArguments[1].getClass().getSimpleName());
            }
            CURRENT_SPAN.set(span);
        } catch (Exception e) {
            log.error("XxlJobHandler beforeExecutorOperation error", e);
        }
    }

    /**
     * 执行器操作后
     */
    public void afterExecutorOperation(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("XxlJobHandler afterExecutorOperation error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 任务回调前
     */
    public void beforeCallback(String className, String methodName, Object[] allArguments, Object target) {
        try {
            Span span = SpanManager.createEntrySpan("xxljob_callback");
            span.addTag("type", "callback");
            span.addTag("action", "callback");
            if (allArguments.length > 0 && allArguments[0] instanceof List) {
                List<?> callbacks = (List<?>) allArguments[0];
                span.addTag("callback_count", String.valueOf(callbacks.size()));
                for (int i = 0; i < callbacks.size() && i < 5; i++) { // 最多记录5个回调
                    Object callback = callbacks.get(i);
                    if (callback instanceof HandleCallbackParam) {
                        HandleCallbackParam param = (HandleCallbackParam) callback;
                        span.addTag("callback." + i + ".job_id", String.valueOf(param.getLogId()));
                    }
                }
            }
            CURRENT_SPAN.set(span);
        } catch (Exception e) {
            log.error("XxlJobHandler beforeCallback error", e);
        }
    }

    /**
     * 任务回调后
     */
    public void afterCallback(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    if (result instanceof ReturnT) {
                        ReturnT returnT = (ReturnT) result;
                        span.addTag("status", returnT.getCode() == ReturnT.SUCCESS_CODE ? "success" : "failed");
                        span.addTag("callback_code", String.valueOf(returnT.getCode()));
                    } else {
                        span.addTag("status", "success");
                    }
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("XxlJobHandler afterCallback error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }
}
