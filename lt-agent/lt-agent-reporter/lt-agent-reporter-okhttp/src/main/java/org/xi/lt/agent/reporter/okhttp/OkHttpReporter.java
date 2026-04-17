package org.xi.lt.agent.reporter.okhttp;

import okhttp3.*;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.config.ConfigUtils;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.common.utils.JsonUtils;
import org.xi.lt.agent.reporter.AbstractReporter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * HTTP上报实现类（优化版）
 * - 使用 OkHttp 连接池，复用连接
 * - 异步批量上报，减少网络开销
 * - 自动重试机制，提高可靠性
 * - JSON 格式，兼容性极好
 * 
 * @author LT Monitor Dev
 * @date 2026/04/17
 */
@LtPlugin(type = LtPluginType.REPORTER, name = "okhttp")
public class OkHttpReporter extends AbstractReporter {
    private static final ILog log = LogFactory.getLog(OkHttpReporter.class.getSimpleName());
    
    private String serverUrl;
    private OkHttpClient httpClient;
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");
    
    // 重试配置
    private static final int MAX_RETRY = 2; // 最大重试次数
    private static final long RETRY_DELAY_MS = 1000; // 重试间隔

    @Override
    public int report(Span span) {
        if (span == null || serverUrl == null) {
            return 0;
        }
        return report(java.util.Collections.singletonList(span));
    }

    @Override
    public int report(List<Span> list) {
        if (list == null || list.isEmpty() || serverUrl == null || httpClient == null) {
            return 0;
        }

        String jsonBody = JsonUtils.toJsonString(list);
        
        // 异步上报，带重试机制
        asyncReportWithRetry(jsonBody, MAX_RETRY);
        
        return list.size();
    }
    
    /**
     * 异步上报，支持自动重试
     */
    private void asyncReportWithRetry(String jsonBody, int retryCount) {
        RequestBody body = RequestBody.create(JSON_MEDIA_TYPE, jsonBody);
        Request request = new Request.Builder()
                .url(serverUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build();
        
        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                if (retryCount > 0) {
                    log.warn("HTTP report failed, will retry. Remaining: " + retryCount + ", Error: " + e.getMessage());
                    // 延迟后重试
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                    asyncReportWithRetry(jsonBody, retryCount - 1);
                } else {
                    log.error("HTTP report failed after all retries. Data may be lost.");
                }
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    log.warn("HTTP report returned non-200 code: " + response.code());
                    if (retryCount > 0) {
                        asyncReportWithRetry(jsonBody, retryCount - 1);
                    }
                }
                // 成功则忽略响应，关闭资源
                response.close();
            }
        });
    }

    @Override
    public int init() {
        serverUrl = ConfigUtils.me().getStr(
                "reporter.serverUrl",
                System.getProperty("lt.agent.report.url", "http://127.0.0.1:8081/apm/report")
        );
        
        // 初始化 OkHttp 客户端，配置连接池
        httpClient = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)      // 连接超时
                .writeTimeout(10, TimeUnit.SECONDS)       // 写入超时
                .readTimeout(10, TimeUnit.SECONDS)        // 读取超时
                .connectionPool(new ConnectionPool(
                        10,                               // 最大空闲连接数
                        5, TimeUnit.MINUTES               // 连接存活时间
                ))
                .retryOnConnectionFailure(true)           // 自动重试连接失败
                .build();
        
        log.info("OkHttpReporter initialized with connection pool. URL: " + serverUrl);
        return 0;
    }
}
