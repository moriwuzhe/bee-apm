package org.xi.lt.common.utils;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class HttpUtils {
    private HttpUtils() {}
    private static final int CONNECT_TIMEOUT = 5000;
    private static final int READ_TIMEOUT = 10000;
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
            } catch (Throwable e) {
                System.out.println("LtAgent HttpUtils POST exception: " + e.getMessage());
                StackTraceElement[] elements = e.getStackTrace();
                for (int i = 0; i < Math.min(20, elements.length); i++) {
                    System.out.println("  at " + elements[i]);
                }
            }
        }).start();
    }
}
