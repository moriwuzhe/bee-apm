package org.xi.lt.agent.plugin.handler;

import com.alibaba.fastjson.JSON;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.model.SpanType;
import org.xi.lt.agent.plugin.common.LtHttpServletRequestWrapper;
import org.xi.lt.agent.plugin.common.LtHttpServletResponseWrapper;
import org.xi.lt.agent.plugin.ServletConfig;
import org.xi.lt.agent.plugin.common.servlet.Const;
import org.xi.lt.agent.reporter.ReporterFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * @author yuan
 * @date 2018/08/05
 */
public class ServletHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("ServletHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        if (!ServletConfig.me().isEnable()) {
            return null;
        }
        HttpServletRequest request = (HttpServletRequest) allArguments[0];
        HttpServletResponse resp = (HttpServletResponse) allArguments[1];
        String url = request.getRequestURL().toString();
        if (ServletConfig.me().isExcludeUrlSuffix(url)) {
            return null;
        }
        Span currSpan = SpanManager.getCurrentSpan();
        if (currSpan == null || !currSpan.getType().equals(SpanType.REQUEST)) {
            LtTraceContext.setGId(request.getHeader(HeaderKey.GID));
            LtTraceContext.setPId(request.getHeader(HeaderKey.PID));
            LtTraceContext.setCTag(request.getHeader(HeaderKey.CTAG));
            Span span = SpanManager.createEntrySpan(SpanType.REQUEST);
            String srcApp = request.getHeader(HeaderKey.SRC_APP);
            if (srcApp == null) {
                srcApp = "nvl";
            }
            span.addTag("srcApp", srcApp);
            span.addTag("srcInst", request.getHeader(HeaderKey.SRC_INST));
            if (ServletConfig.me().isEnableRespBody() && !resp.getClass().getSimpleName().equals(Const.CLASS_LT_HTTP_SERVLET_RESPONSE_WRAPPER)) {
                LtHttpServletResponseWrapper wrapper = new LtHttpServletResponseWrapper(resp);
                //在ServletAdvice里取出来要清除掉
                span.addTag(Const.KEY_RESP_WRAPPER, wrapper);
            }
            if (ServletConfig.me().isEnableReqBody() && !request.getClass().getSimpleName().equals(Const.CLASS_LT_HTTP_SERVLET_REQUEST_RAPPER)) {
                LtHttpServletRequestWrapper wrapper = new LtHttpServletRequestWrapper(request);
                //在ServletAdvice里取出来要清除掉
                span.addTag(Const.KEY_REQ_WRAPPER, wrapper);
            }
            SpanManager.createTopologySpan(request.getHeader(HeaderKey.SRC_APP), LtConfig.me().getApp());
            MdcAdapterUtils.init(null);
            MdcAdapterUtils.put("traceId", span.getGid());
            return span;
        }
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        Span currSpan = SpanManager.getCurrentSpan();
        HttpServletResponse response = (HttpServletResponse) allArguments[1];
        // 测试阶段强制所有请求都上报
        if (!ServletConfig.me().isEnable()) {
            flush(response);
            return null;
        }
        if (currSpan != null && currSpan.getType().equals(SpanType.REQUEST)) {
            Span span = SpanManager.getExitSpan();
            HttpServletRequest request = (HttpServletRequest) allArguments[0];
            span.addTag("url", request.getRequestURL());
            span.addTag("remote", request.getRemoteAddr());
            span.addTag("method", request.getMethod());
            calculateSpend(span);
            if (span.getSpend() > ServletConfig.me().getSpend()) {
                //返回gid，用于跟踪
                response.setHeader(HeaderKey.GID, span.getGid());
                //返回id，用于跟踪
                response.setHeader(HeaderKey.ID, span.getId());
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
                //采集参数
                collectRequestParameter(span, request);
                //采集RequestBody
                collectRequestBody(span, request);
                //采集header
                collectRequestHeader(span, request);
                //采集ResponseBody
                collectResponseBody(span, response);
            }
            flush(response);
            MdcAdapterUtils.remove("traceId");
            return result;
        }
        flush(response);
        return null;
    }

    private void flush(HttpServletResponse response) {
        try {
            response.flushBuffer();
        } catch (Exception e) {
            log.error("response flush error", e);
        }
    }

    /**
     * 收集请求参数
     *
     * @param span
     * @param request
     */
    private void collectRequestParameter(Span span, HttpServletRequest request) {
        if (ServletConfig.me().isEnableReqParam()) {
            Map<String, String[]> params = request.getParameterMap();
            if (params != null && !params.isEmpty()) {
                Span paramSpan = new Span(SpanType.REQUEST_PARAM);
                paramSpan.setId(span.getId());
                paramSpan.addTag("param", JSON.toJSONString(params));
                ReporterFactory.report(paramSpan);
            }
        }
    }

    /**
     * 收集RequestBody
     *
     * @param span
     * @param request
     */
    private void collectRequestBody(Span span, HttpServletRequest request) {
        if (request instanceof LtHttpServletRequestWrapper) {
            LtHttpServletRequestWrapper wrapper = (LtHttpServletRequestWrapper) request;
            Span bodySpan = new Span(SpanType.REQUEST_BODY);
            bodySpan.setId(span.getId());
            String body = new String(wrapper.getBody());
            if (body != null && !body.isEmpty()) {
                bodySpan.addTag("body", new String(wrapper.getBody()));
                ReporterFactory.report(bodySpan);
            }
        }
    }

    /**
     * 收集RequestHeader
     *
     * @param span
     * @param request
     */
    private void collectRequestHeader(Span span, HttpServletRequest request) {
        if (ServletConfig.me().isEnableReqHeaders()) {
            Map<String, String> headers = new HashMap<String, String>(8);
            Enumeration headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String key = (String) headerNames.nextElement();
                String value = request.getHeader(key);
                headers.put(key, value);
            }
            if (!headers.isEmpty()) {
                Span headersSpan = new Span(SpanType.REQUEST_HEADERS);
                headersSpan.setId(span.getId());
                headersSpan.addTag("headers", JSON.toJSONString(headers));
                ReporterFactory.report(headersSpan);
            }
        }
    }

    /**
     * 收集ResponseBody
     *
     * @param span
     * @param resp
     */
    private void collectResponseBody(Span span, HttpServletResponse resp) {
        if (resp instanceof LtHttpServletResponseWrapper) {
            LtHttpServletResponseWrapper ltResp = (LtHttpServletResponseWrapper) resp;
            //触发原有的输出
            ltResp.writeOriginOutputStream();
            Span respSpan = new Span(SpanType.RESPONSE_BODY);
            respSpan.setId(span.getId());
            byte[] body = ltResp.toByteArray();
            if (body != null && body.length > 0) {
                respSpan.addTag("body", new String(body));
                ReporterFactory.report(respSpan);
            }
        }
    }
}
