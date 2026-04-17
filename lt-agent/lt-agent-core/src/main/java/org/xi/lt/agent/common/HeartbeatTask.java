package org.xi.lt.agent.common;

import org.xi.lt.agent.Version;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.model.SpanType;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * 心跳数据
 * @author yuan
 * @date 2018-11-07
 */
import java.util.Date;
import java.util.concurrent.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class HeartbeatTask {
    private static final String THREAD_NAME = "heartbeat";
    private static ScheduledExecutorService service = new ScheduledThreadPoolExecutor(1, new LtThreadFactory(THREAD_NAME));

    public static String id;

    public static void start() {
        int period = LtConfig.me().getHeartbeatPeriod();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                // 原有APM监控心跳
                Span span = new Span(SpanType.HEARTBEAT);
                span.setId(getId());
                LtConfig.me().fillEnvInfo(span);
                span.setTime(new Date());
                span.addTag("version", Version.VERSION);
                ReporterFactory.report(span);

                // 发送控制面心跳与配置检测
                sendControlPlaneHeartbeat();
            }
        }, 0, period, TimeUnit.SECONDS);
    }

    private static void sendControlPlaneHeartbeat() {
        try {
            String serverUrl = org.xi.lt.agent.config.ConfigUtils.me().getStr("control.server.url", "http://127.0.0.1:8081");
            URL url = new URL(serverUrl + "/api/agent/heartbeat");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);

            // 添加 projectCode 和 secretKey 用于服务端鉴权
            String projectCode = System.getProperty("lt.project", org.xi.lt.agent.config.ConfigUtils.me().getStr("projectCode", "default"));
            String secretKey = System.getProperty("lt.secret", org.xi.lt.agent.config.ConfigUtils.me().getStr("secretKey", ""));
            
            String jsonPayload = String.format(
                "{\"app\":\"%s\",\"inst\":\"%s\",\"ip\":\"%s\",\"version\":\"%s\",\"configVersion\":\"%s\",\"projectCode\":\"%s\",\"secretKey\":\"%s\"}",
                LtConfig.me().getApp(), 
                LtConfig.me().getInst(), 
                LtConfig.me().getIp(), 
                Version.VERSION, 
                org.xi.lt.agent.config.ConfigUtils.me().getStr("config.version", "0"),
                projectCode,
                secretKey
            );

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                // 解析响应检查配置和插件更新
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    String responseBody = response.toString();
                    
                    // 简单解析 JSON 检查插件更新
                    boolean hasNewPlugins = responseBody.contains("\"hasNewPlugins\":true");
                    long pluginLastUpdateTime = extractPluginLastUpdateTime(responseBody);
                    
                    if (hasNewPlugins) {
                        org.xi.lt.agent.plugin.PluginUpdateManager.checkAndUpdatePlugins(hasNewPlugins, pluginLastUpdateTime);
                    }
                }
            }
            conn.disconnect();
        } catch (Exception e) {
            // Ignore control plane errors
        }
    }
    
    /**
     * 从响应中提取插件最后更新时间
     */
    private static long extractPluginLastUpdateTime(String responseBody) {
        try {
            String key = "\"pluginLastUpdateTime\":";
            int index = responseBody.indexOf(key);
            if (index != -1) {
                int start = index + key.length();
                int end = responseBody.indexOf(",", start);
                if (end == -1) {
                    end = responseBody.indexOf("}", start);
                }
                if (end != -1) {
                    return Long.parseLong(responseBody.substring(start, end).trim());
                }
            }
        } catch (Exception e) {
            // 解析失败返回 0
        }
        return 0;
    }


    public static void shutdown() {
        LtUtils.shutdown(service);
    }

    private static String getId() {
        if (id != null) {
            return id;
        }
        id = LtConfig.me().getEnv() + "_" + LtConfig.me().getApp() + "_" + LtConfig.me().getInst() + "_" + LtConfig.me().getPort();
        return id;
    }
}
