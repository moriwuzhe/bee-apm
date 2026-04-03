package org.xi.lt.agent.plugin.elasticsearch.handler;

import org.elasticsearch.action.ActionRequest;
import org.elasticsearch.action.ActionResponse;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.Optional;

/**
 * Elasticsearch调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class ElasticsearchHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("ElasticsearchHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建Elasticsearch操作Span
            Span span = SpanManager.createEntrySpan("elasticsearch");
            
            span.addTag("client_type", className.contains("Rest") ? "rest" : "transport");
            
            // 处理不同类型的客户端
            if (className.contains("Rest")) {
                // Rest客户端
                if (allArguments != null && allArguments.length > 0 && allArguments[0] instanceof Request) {
                    Request request = (Request) allArguments[0];
                    span.addTag("method", request.getMethod());
                    span.addTag("endpoint", request.getEndpoint());
                    if (request.getEntity() != null) {
                        span.addTag("content_length", String.valueOf(request.getEntity().getContentLength()));
                    }
                }
            } else {
                // Transport客户端
                if (allArguments != null && allArguments.length > 0 && allArguments[0] instanceof ActionRequest) {
                    ActionRequest request = (ActionRequest) allArguments[0];
                    String actionName = request.getClass().getSimpleName().replace("Request", "");
                    span.addTag("action", actionName);
                    
                    // 尝试获取索引名称
                    try {
                        Field indicesField = request.getClass().getDeclaredField("indices");
                        indicesField.setAccessible(true);
                        String[] indices = (String[]) indicesField.get(request);
                        if (indices != null && indices.length > 0) {
                            span.addTag("indices", String.join(",", indices));
                        }
                    } catch (Exception e) {
                        // 忽略反射获取异常
                    }
                }
            }
            
            // 尝试获取集群地址
            Object client = extVal[0];
            try {
                if (className.contains("RestHighLevelClient")) {
                    Field restClientField = client.getClass().getDeclaredField("client");
                    restClientField.setAccessible(true);
                    Object restClient = restClientField.get(client);
                    // 可以继续获取节点地址信息
                }
            } catch (Exception e) {
                // 忽略反射获取异常
            }
            
            return span;
        } catch (Exception e) {
            log.error("ElasticsearchHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("elasticsearch")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                } else if (result instanceof Response) {
                    // Rest客户端响应
                    Response response = (Response) result;
                    span.addTag("status", String.valueOf(response.getStatusLine().getStatusCode()));
                    if (response.getStatusLine().getStatusCode() >= 400) {
                        span.addTag("error", "true");
                    }
                } else if (result instanceof ActionResponse) {
                    // Transport客户端响应
                    // 可以采集响应相关信息
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("ElasticsearchHandler after error", e);
            return result;
        }
    }
}
