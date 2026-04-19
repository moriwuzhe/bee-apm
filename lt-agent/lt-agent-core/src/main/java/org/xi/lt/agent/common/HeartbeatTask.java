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
                    
                    // 检查是否有新配置
                    boolean hasNewConfig = responseBody.contains("\"hasNewConfig\":true");
                    if (hasNewConfig) {
                        pullAndApplyNewConfig();
                    }
                    
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
    
    /**
     * 拉取并应用新配置
     */
    private static void pullAndApplyNewConfig() {
        try {
            String serverUrl = org.xi.lt.agent.config.ConfigUtils.me().getStr("control.server.url", "http://127.0.0.1:8081");
            String app = LtConfig.me().getApp();
            String inst = LtConfig.me().getInst();
            
            // 构建拉取配置的URL（优先使用实例级配置）
            String configUrl = serverUrl + "/api/agent/config/pull?app=" + app + "&inst=" + inst;
            URL url = new URL(configUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    String responseBody = response.toString();
                    
                    // 提取配置内容和版本
                    String config = extractConfigContent(responseBody);
                    String version = extractConfigVersion(responseBody);
                    
                    if (config != null && !config.trim().isEmpty() && version != null) {
                        // 应用新配置
                        applyConfig(config, version);
                        System.out.println("[LT-Agent] Config updated successfully, version: " + version);
                    } else if (config != null && config.trim().isEmpty()) {
                        System.out.println("[LT-Agent] Config is empty, skip updating");
                    }
                }
            }
            conn.disconnect();
        } catch (Exception e) {
            System.err.println("[LT-Agent] Failed to pull config: " + e.getMessage());
        }
    }
    
    /**
     * 从响应中提取配置内容
     */
    private static String extractConfigContent(String responseBody) {
        try {
            String key = "\"config\":\"";
            int index = responseBody.indexOf(key);
            if (index != -1) {
                int start = index + key.length();
                int end = responseBody.lastIndexOf("\"");
                if (end > start) {
                    // 处理转义字符
                    String config = responseBody.substring(start, end);
                    return config.replace("\\n", "\n").replace("\\t", "\t").replace("\\\"", "\"");
                }
            }
        } catch (Exception e) {
            // 解析失败返回 null
        }
        return null;
    }
    
    /**
     * 从响应中提取配置版本
     */
    private static String extractConfigVersion(String responseBody) {
        try {
            String key = "\"version\":\"";
            int index = responseBody.indexOf(key);
            if (index != -1) {
                int start = index + key.length();
                int end = responseBody.indexOf("\"", start);
                if (end != -1) {
                    return responseBody.substring(start, end);
                }
            }
        } catch (Exception e) {
            // 解析失败返回 null
        }
        return null;
    }
    
    /**
     * 应用新配置
     */
    private static void applyConfig(String config, String version) {
        try {
            // 1. 保存配置到本地文件
            String configPath = System.getProperty("lt.config", org.xi.lt.agent.config.ConfigUtils.me().getStr("config.path", ""));
            if (configPath == null || configPath.isEmpty()) {
                configPath = org.xi.lt.agent.common.LtUtils.getJarDirPath() + "/config.yml";
            }
            
            java.io.File configFile = new java.io.File(configPath);
            java.nio.file.Files.write(configFile.toPath(), config.getBytes("UTF-8"));
            
            // 2. 更新配置版本号
            System.setProperty("config.version", version);
            org.xi.lt.agent.config.ConfigUtils.me().setStr("config.version", version);
            
            // 3. 重新加载配置
            org.xi.lt.agent.config.ConfigUtils.me().loadConfig();
            org.xi.lt.agent.config.LtConfigFactory.me().refresh();
            
            // 4. 动态应用配置（采样率、插件开关等）
            applyDynamicConfig(config);
            
        } catch (Exception e) {
            System.err.println("[LT-Agent] Failed to apply config: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 动态应用配置（无需重启即可生效的配置项）
     */
    private static void applyDynamicConfig(String config) {
        try {
            // 这里可以解析YAML配置并动态应用到各个模块
            // 例如：更新采样率、插件开关、日志级别等
            
            // 示例：更新采样率
            int rateIndex = config.indexOf("rate:");
            if (rateIndex != -1) {
                int start = rateIndex + 5;
                int end = config.indexOf("\n", start);
                if (end == -1) end = config.length();
                String rateStr = config.substring(start, end).trim();
                try {
                    int newRate = Integer.parseInt(rateStr);
                    org.xi.lt.agent.config.LtConfig.me().setRate(newRate);
                    System.out.println("[LT-Agent] Sampling rate updated to: " + newRate);
                } catch (NumberFormatException e) {
                    // 忽略解析错误
                }
            }
            
            // TODO: 可以扩展更多动态配置项
            // - 插件开关
            // - 日志级别
            // - 性能阈值
            // - 上报间隔等
            
        } catch (Exception e) {
            System.err.println("[LT-Agent] Failed to apply dynamic config: " + e.getMessage());
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
