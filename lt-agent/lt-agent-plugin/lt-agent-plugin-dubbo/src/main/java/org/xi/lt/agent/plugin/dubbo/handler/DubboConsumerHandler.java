package org.xi.lt.agent.plugin.dubbo.handler;

import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.Result;
import org.apache.dubbo.rpc.RpcContext;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.model.SpanType;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Dubbo Consumer端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class DubboConsumerHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("DubboConsumerHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            Invocation invocation = (Invocation) allArguments[0];
            Invoker<?> invoker = (Invoker<?>) extVal[0];
            
            // 创建Dubbo调用Span
            Span span = SpanManager.createEntrySpan("dubbo");
            String serviceName = invoker.getInterface().getName();
            String methodNameDubbo = invocation.getMethodName();
            
            span.addTag("service", serviceName);
            span.addTag("method", methodNameDubbo);
            span.addTag("version", invoker.getUrl().getParameter("version", ""));
            span.addTag("group", invoker.getUrl().getParameter("group", ""));
            span.addTag("provider.ip", invoker.getUrl().getAddress());
            span.addTag("consumer.ip", RpcContext.getContext().getLocalAddressString());
            span.addTag("arguments", invocation.getArguments() != null ? invocation.getArguments().toString() : "[]");
            
            // 将链路信息传递到Provider端
            invocation.getAttachments().put(HeaderKey.GID, span.getGid());
            invocation.getAttachments().put(HeaderKey.PID, span.getId());
            invocation.getAttachments().put(HeaderKey.CTAG, LtTraceContext.getCTag());
            invocation.getAttachments().put(HeaderKey.SRC_APP, LtConfig.me().getApp());
            
            // 创建拓扑Span
            SpanManager.createTopologySpan(LtConfig.me().getApp(), serviceName);
            
            return span;
        } catch (Exception e) {
            log.error("DubboConsumerHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("dubbo")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                } else if (result != null && result instanceof Result && ((Result) result).hasException()) {
                    span.addTag("error", "true");
                    span.addTag("error.message", ((Result) result).getException().getMessage());
                }
                
                // 上报Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("DubboConsumerHandler after error", e);
            return result;
        }
    }
}
