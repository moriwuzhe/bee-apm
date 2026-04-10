package org.xi.lt.common.utils;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * HTTP工具类
 * 提供同步/异步HTTP GET、POST请求能力，适合Agent数据上报场景
 */
public class HttpUtils {

    private HttpUtils() {
        // 工具类禁止实例化
    }

    private static final int CONNECT_TIMEOUT = 5000;
    private static final int READ_TIMEOUT = 10000;

    // ====================== 异步POST请求（用于Agent上报，不阻塞主线程） ======================
    /**
     * 异步POST JSON请求，无回调（适合上报场景，不需要关心结果）
     * @param urlString 请求URL
     * @param jsonStr 请求体JSON字符串
     */
    public static void asyncPostJson(String urlString, String jsonStr) {
        new Thread(() -> {
            try {
                System.out.println("LtAgent HttpUtils POST start: " + urlString);
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(CONNECT_TIMEOUT);
                conn.setReadTimeout(READ_TIMEOUT);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonStr.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                    os.flush();
                }

                int responseCode = conn.getResponseCode();
                System.out.println("LtAgent HttpUtils POST done, code: " + responseCode);
                if (responseCode >= 200 && responseCode < 300) {
                    // Success
                } else {
                    System.out.println("LtAgent HttpUtils POST failed, code: " + responseCode);
                }
            } catch (Exception e) {
                System.out.println("LtAgent HttpUtils POST exception: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();
    }
}
