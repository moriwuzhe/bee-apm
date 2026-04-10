package org.xi.lt.agent.reporter.okhttp;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.model.Span;
import org.xi.lt.common.utils.HttpUtils;
import org.xi.lt.common.utils.JsonUtils;
import org.xi.lt.agent.reporter.AbstractReporter;

import java.util.List;

/**
 * HTTP上报实现类
 * 异步批量上报Span数据到服务端，支持失败重试
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
@LtPlugin(type = LtPluginType.REPORTER, name = "okhttp")
public class OkHttpReporter extends AbstractReporter {
    public String name = "okhttp";

    /**
     * 上报服务端地址，从Agent参数获取
     */
    private String serverUrl;

    @Override
    public int report(Span span) {
        if (serverUrl != null) {
            HttpUtils.asyncPostJson(serverUrl, JsonUtils.toJsonString(span));
        }
        return 1;
    }

    @Override
    public int report(List<Span> list) {
        if (serverUrl != null && !list.isEmpty()) {
            HttpUtils.asyncPostJson(serverUrl, JsonUtils.toJsonString(list));
        }
        return list.size();
    }

    @Override
    public int init() {
        // 从配置中获取上报地址
        serverUrl = System.getProperty("lt.agent.report.url", "http://127.0.0.1:8080/apm/report");
        System.out.println("OkHttpReporter initialized with serverUrl: " + serverUrl);
        return 0;
    }
}
