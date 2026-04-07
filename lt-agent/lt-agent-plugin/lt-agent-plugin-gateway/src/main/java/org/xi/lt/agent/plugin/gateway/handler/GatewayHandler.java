package org.xi.lt.agent.plugin.gateway.handler;

import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.util.List;

/**
 * Spring Cloud Gateway调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class GatewayHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("GatewayHandler");
    private static final String SPAN_ATTR = "LT_GATEWAY_SPAN";

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            ServerWebExchange exchange = (ServerWebExchange) extVal[0];
            ServerHttpRequest request = exchange.getRequest();
            
            // 从请求头中获取上游链路信息
            HttpHeaders headers = request.getHeaders();
            String traceId = getFirstHeader(headers, "traceId");
            String parentSpanId = getFirstHeader(headers, "spanId");
            
            // 创建网关入口Span
            Span span = SpanManager.createEntrySpan("gateway", traceId, parentSpanId);
            span.addTag("gateway_route_id", (String) exchange.getAttribute("org.springframework.cloud.gateway.support.ServerWebExchangeUtils.gatewayRouteId"));
            span.addTag("request_method", request.getMethodValue());
            span.addTag("request_path", request.getPath().value());
            span.addTag("remote_address", request.getRemoteAddress() != null ? request.getRemoteAddress().toString() : "");
            span.addTag("user_agent", getFirstHeader(headers, "User-Agent"));
            
            // 将链路信息保存到exchange属性中，后续透传到下游
            exchange.getAttributes().put(SPAN_ATTR, span);
            
            // 透传链路信息到下游请求头
            exchange.mutate()
                    .request(builder -> builder
                            .header("traceId", span.getGid())
                            .header("spanId", span.getId())
                            .header("sourceApp", LtConfig.me().getApp())
                    )
                    .build();
            
            return span;
        } catch (Exception e) {
            log.error("GatewayHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            ServerWebExchange exchange = (ServerWebExchange) extVal[0];
            Span span = (Span) exchange.getAttribute(SPAN_ATTR);
            if (span != null && span.getType().equals("gateway")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常和响应状态
                ServerHttpResponse response = exchange.getResponse();
                span.addTag("response_status", String.valueOf(response.getStatusCode() != null ? response.getStatusCode().value() : 0));
                
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                } else if (response.getStatusCode() != null && response.getStatusCode().isError()) {
                    span.addTag("error", "true");
                }
                
                // 上报Span
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
                
                // 清理属性
                exchange.getAttributes().remove(SPAN_ATTR);
            }
            return result;
        } catch (Exception e) {
            log.error("GatewayHandler after error", e);
            return result;
        }
    }

    /**
     * 获取第一个请求头值
     */
    private String getFirstHeader(HttpHeaders headers, String name) {
        List<String> values = headers.get(name);
        if (values != null && !values.isEmpty()) {
            return values.get(0);
        }
        return null;
    }
}
