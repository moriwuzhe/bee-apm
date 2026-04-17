package org.xi.lt.agent.boot;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.xi.lt.agent.common.LtUtils;
import org.xi.lt.agent.config.ConfigUtils;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.LogUtil;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.management.ManagementFactory;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Agent HTTP 注册器
 * 在 agent 启动时通过 HTTP POST 将 agent 信息注册到管理平台
 * 
 * @author LT Monitor Dev
 * @date 2026/04/16
 */
public class AgentHttpRegistrar {
    
    private static final String DEFAULT_REGISTER_URL = "http://127.0.0.1:8081/apm/agent/register";
    private static final int CONNECT_TIMEOUT = 3000;
    private static final int READ_TIMEOUT = 5000;
    private static final int MAX_RETRY = 3;
    private static final long RETRY_INTERVAL_MS = 2000;
    
    /**
     * 执行注册
     */
    public static void register() {
        // 优先使用配置的 agent.register.url
        String registerUrl = ConfigUtils.me().getStr("agent.register.url");
        
        // 如果没有配置，使用默认地址
        if (LtUtils.isBlank(registerUrl)) {
            registerUrl = DEFAULT_REGISTER_URL;
        }
        
        LogUtil.log("start register agent to management platform, url=" + registerUrl);
        
        boolean success = false;
        for (int i = 0; i < MAX_RETRY; i++) {
            try {
                if (doRegister(registerUrl)) {
                    success = true;
                    LogUtil.log("agent registered to management platform successfully");
                    break;
                }
            } catch (Exception e) {
                LogUtil.log("agent register attempt " + (i + 1) + " failed: " + e.getMessage());
            }
            
            if (!success && i < MAX_RETRY - 1) {
                try {
                    Thread.sleep(RETRY_INTERVAL_MS);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        if (!success) {
            LogUtil.log("agent register failed after " + MAX_RETRY + " attempts, will continue running without registration");
        }
    }
    
    /**
     * 执行单次注册请求
     */
    private static boolean doRegister(String registerUrl) throws Exception {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(registerUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(CONNECT_TIMEOUT);
            conn.setReadTimeout(READ_TIMEOUT);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            conn.setDoOutput(true);
            
            // 构建注册信息
            JSONObject registerData = buildRegisterData();
            String jsonBody = JSON.toJSONString(registerData);
            
            // 发送请求
            OutputStream os = conn.getOutputStream();
            os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();
            
            // 读取响应
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
                );
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                LogUtil.log("register response: " + response.toString());
                return true;
            } else {
                LogUtil.log("register failed with response code: " + responseCode);
                return false;
            }
            
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
    
    /**
     * 构建注册数据
     */
    private static JSONObject buildRegisterData() {
        LtConfig config = LtConfig.me();
        Map<String, Object> data = new HashMap<>();
        
        // 基础信息
        data.put("agentId", buildAgentId());
        data.put("projectCode", config.getProject());
        data.put("app", config.getApp());
        data.put("env", config.getEnv());
        data.put("inst", config.getInst());
        data.put("ip", config.getIp());
        data.put("port", config.getPort());
        data.put("project", config.getProject());
        data.put("secretKey", config.getSecret());

        // JVM 信息
        data.put("pid", getCurrentPid());
        data.put("javaVersion", System.getProperty("java.version"));
        data.put("javaVendor", System.getProperty("java.vendor"));
        data.put("osName", System.getProperty("os.name"));
        data.put("osArch", System.getProperty("os.arch"));
        data.put("osVersion", System.getProperty("os.version"));
        
        // 启动时间
        data.put("startTime", System.currentTimeMillis());
        data.put("uptime", ManagementFactory.getRuntimeMXBean().getUptime());
        
        // Agent 版本信息
        data.put("agentVersion", "1.0.0");
        
        return new JSONObject(data);
    }
    
    /**
     * 构建 Agent ID
     */
    private static String buildAgentId() {
        LtConfig config = LtConfig.me();
        StringBuilder sb = new StringBuilder();
        
        if (LtUtils.isNotBlank(config.getApp())) {
            sb.append(config.getApp());
        }
        if (LtUtils.isNotBlank(config.getEnv())) {
            sb.append("@").append(config.getEnv());
        }
        if (LtUtils.isNotBlank(config.getInst())) {
            sb.append("@").append(config.getInst());
        }
        if (LtUtils.isNotBlank(config.getIp()) || LtUtils.isNotBlank(config.getPort())) {
            sb.append("@").append(config.getIp() == null ? "" : config.getIp())
              .append(":")
              .append(config.getPort() == null ? "" : config.getPort());
        }
        
        if (sb.length() == 0) {
            sb.append("agent@").append(java.util.UUID.randomUUID().toString().replace("-", ""));
        }
        
        return sb.toString();
    }
    
    /**
     * 获取当前进程 PID
     */
    private static String getCurrentPid() {
        try {
            String name = ManagementFactory.getRuntimeMXBean().getName();
            if (name != null && !name.isEmpty()) {
                return name.split("@")[0];
            }
        } catch (Exception ignored) {
        }
        
        try {
            Class<?> ph = Class.forName("java.lang.ProcessHandle");
            Object cur = ph.getMethod("current").invoke(null);
            Object v = ph.getMethod("pid").invoke(cur);
            return String.valueOf(v);
        } catch (Exception ignored) {
        }
        
        return "unknown";
    }
}
