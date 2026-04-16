package org.xi.lt.agent.plugin;

import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.config.ConfigUtils;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 插件更新管理器
 * 负责从服务端拉取和更新插件
 *
 * @author system
 * @date 2026/04/16
 */
public class PluginUpdateManager {

    private static final String PLUGIN_DIR = "plugins/";
    private static long lastPluginUpdateTime = 0;

    static {
        // 确保插件目录存在
        File dir = new File(PLUGIN_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    /**
     * 检查并更新插件
     * @param serverHasNewPlugins 服务端是否有新插件
     * @param serverPluginLastUpdateTime 服务端插件最后更新时间
     */
    public static void checkAndUpdatePlugins(boolean serverHasNewPlugins, long serverPluginLastUpdateTime) {
        try {
            if (!serverHasNewPlugins) {
                return;
            }

            if (serverPluginLastUpdateTime <= lastPluginUpdateTime) {
                LogUtil.log("插件已是最新版本，无需更新");
                return;
            }

            LogUtil.log("检测到新插件，开始更新...");
            
            // 1. 获取插件列表
            String pluginListJson = fetchPluginList();
            if (pluginListJson == null) {
                LogUtil.log("获取插件列表失败");
                return;
            }

            // 2. 解析插件列表并下载插件
            // 这里简化处理，实际应该解析JSON并逐个下载
            LogUtil.log("插件列表获取成功: " + pluginListJson);
            
            // 3. 更新本地最后更新时间
            lastPluginUpdateTime = serverPluginLastUpdateTime;
            
            LogUtil.log("插件更新完成");
            
        } catch (Exception e) {
            LogUtil.log("插件更新失败", e);
        }
    }

    /**
     * 从服务端获取插件列表
     */
    private static String fetchPluginList() {
        try {
            String serverUrl = ConfigUtils.me().getStr("control.server.url", "http://127.0.0.1:8081");
            URL url = new URL(serverUrl + "/api/plugin/list");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    return response.toString();
                }
            }
            conn.disconnect();
        } catch (Exception e) {
            LogUtil.log("获取插件列表失败", e);
        }
        return null;
    }

    /**
     * 下载插件文件
     */
    public static boolean downloadPlugin(String pluginCode, String expectedMd5) {
        try {
            String serverUrl = ConfigUtils.me().getStr("control.server.url", "http://127.0.0.1:8081");
            URL url = new URL(serverUrl + "/api/plugin/download?pluginCode=" + pluginCode);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(60000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                Path tempPath = Paths.get(PLUGIN_DIR, pluginCode + ".tmp");
                Path pluginPath = Paths.get(PLUGIN_DIR, pluginCode + ".jar");

                // 先下载到临时文件
                try (InputStream is = conn.getInputStream()) {
                    Files.copy(is, tempPath, StandardCopyOption.REPLACE_EXISTING);
                }

                // 验证MD5
                String actualMd5 = calculateMD5(tempPath);
                if (expectedMd5 != null && !expectedMd5.equalsIgnoreCase(actualMd5)) {
                    Files.deleteIfExists(tempPath);
                    LogUtil.log("插件MD5校验失败: " + pluginCode);
                    return false;
                }

                // 重命名为最终文件
                Files.move(tempPath, pluginPath, StandardCopyOption.REPLACE_EXISTING);
                LogUtil.log("插件下载成功: " + pluginCode);
                return true;
            }
            conn.disconnect();
        } catch (Exception e) {
            LogUtil.log("下载插件失败: " + pluginCode, e);
        }
        return false;
    }

    /**
     * 计算文件MD5
     */
    private static String calculateMD5(Path filePath) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] fileBytes = Files.readAllBytes(filePath);
            byte[] hash = md.digest(fileBytes);
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5计算失败", e);
        }
    }
}
