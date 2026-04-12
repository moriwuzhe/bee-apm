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

import java.util.Map;

/**
 * Dubbo Provider端调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class DubboProviderHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("DubboProviderHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            Invocation invocation = (Invocation) allArguments[0];
            Invoker<?> invoker = (Invoker<?>) extVal[0];
            
            // 从RpcContext中获取上游传递的链路信息
            Map<String, String> attachments = RpcContext.getContext().getAttachments();
            
            // 设置链路上下文
            LtTraceContext.setGId(attachments.get(HeaderKey.GID));
            LtTraceContext.setPId(attachments.get(HeaderKey.PID));
            LtTraceContext.setCTag(attachments.get(HeaderKey.CTAG));
            
            // 创建入口Span
            Span span = SpanManager.createEntrySpan("dubbo");
            String serviceName = invoker.getInterface().getName();
            String methodNameDubbo = invocation.getMethodName();
            
            span.addTag("service", serviceName);
            span.addTag("method", methodNameDubbo);
            span.addTag("version", invoker.getUrl().getParameter("version", ""));
            span.addTag("group", invoker.getUrl().getParameter("group", ""));
            span.addTag("consumer.ip", RpcContext.getContext().getRemoteAddressString());
            span.addTag("provider.ip", RpcContext.getContext().getLocalAddressString());
            span.addTag("arguments", invocation.getArguments() != null ? invocation.getArguments().toString() : "[]");
            
            // 创建拓扑Span
            String srcApp = attachments.get(HeaderKey.SRC_APP);
            if (srcApp == null) {
                srcApp = "nvl";
            }
            SpanManager.createTopologySpan(srcApp, LtConfig.me().getApp());
            
            return span;
        } catch (Exception e) {
            log.error("DubboProviderHandler before error", e);
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
            log.error("DubboProviderHandler after error", e);
            return result;
        }
    }
}
