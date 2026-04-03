package org.xi.lt.agent.plugin.feign.handler;

import feign.Request;
import feign.Response;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;

/**
 * Feign远程调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class FeignHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("FeignHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建Feign调用Span
            Span span = SpanManager.createEntrySpan("rpc_feign");
            
            // 处理Client.execute方法
            if (methodName.equals("execute") && allArguments.length >= 2) {
                Request request = (Request) allArguments[0];
                Request.Options options = (Request.Options) allArguments[1];
                
                span.addTag("http_method", request.httpMethod().name());
                span.addTag("url", request.url());
                span.addTag("content_length", String.valueOf(request.body() != null ? request.body().length : 0));
                
                // 将链路信息添加到请求头
                Map<String, Collection<String>> headers = request.headers();
                String traceId = SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getGid() : IdHelper.id();
                String spanId = SpanManager.getCurrentSpan() != null ? SpanManager.getCurrentSpan().getId() : IdHelper.id();
                String sourceApp = BeeConfig.me().getApp();
                headers.put("traceId", Collections.singletonList(traceId));
                headers.put("spanId", Collections.singletonList(spanId));
                headers.put("sourceApp", Collections.singletonList(sourceApp));
            } 
            // 处理SynchronousMethodHandler.invoke方法
            else if (methodName.equals("invoke") && className.contains("SynchronousMethodHandler")) {
                try {
                    // 反射获取目标方法信息
                    Object target = extVal[0];
                    Field methodMetadataField = target.getClass().getDeclaredField("methodMetadata");
                    methodMetadataField.setAccessible(true);
                    Object methodMetadata = methodMetadataField.get(target);
                    
                    Field configKeyField = methodMetadata.getClass().getDeclaredField("configKey");
                    configKeyField.setAccessible(true);
                    String configKey = (String) configKeyField.get(methodMetadata);
                    
                    span.addTag("interface_method", configKey);
                } catch (Exception e) {
                    // 忽略反射获取异常
                }
            }
            
            return span;
        } catch (Exception e) {
            log.error("FeignHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("rpc_feign")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                } else if (result instanceof Response) {
                    // 获取响应状态
                    Response response = (Response) result;
                    span.addTag("http_status", String.valueOf(response.status()));
                    if (response.status() >= 400) {
                        span.addTag("error", "true");
                    }
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("FeignHandler after error", e);
            return result;
        }
    }
}
