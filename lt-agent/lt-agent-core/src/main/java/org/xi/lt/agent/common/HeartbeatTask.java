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
            String serverUrl = org.xi.lt.agent.config.ConfigUtils.me().getStr("control.server.url", "http://127.0.0.1:8080");
            URL url = new URL(serverUrl + "/api/agent/heartbeat");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);

            String jsonPayload = String.format("{\"app\":\"%s\",\"inst\":\"%s\",\"ip\":\"%s\",\"version\":\"%s\",\"configVersion\":\"%s\"}",
                    LtConfig.me().getApp(), LtConfig.me().getInst(), LtConfig.me().getIp(), Version.VERSION, org.xi.lt.agent.config.ConfigUtils.me().getStr("config.version", "0"));

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                // Here we would parse response to check hasNewConfig and pull it
                // For simplicity, we can do it in the future
            }
            conn.disconnect();
        } catch (Exception e) {
            // Ignore control plane errors
        }
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
