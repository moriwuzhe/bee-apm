package org.xi.lt.common.utils;

import okhttp3.*;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * HTTP工具类，基于OkHttp3封装
 * 提供同步/异步HTTP GET、POST请求能力，适合Agent数据上报场景
 */
public class HttpUtils {

    private HttpUtils() {
        // 工具类禁止实例化
    }

    // 默认连接超时时间（秒）
    private static final int CONNECT_TIMEOUT = 5;
    // 默认读取超时时间（秒）
    private static final int READ_TIMEOUT = 10;
    // 默认写入超时时间（秒）
    private static final int WRITE_TIMEOUT = 10;

    // JSON媒体类型
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    // 全局OkHttpClient实例，连接池复用
    private static final OkHttpClient HTTP_CLIENT = new OkHttpClient.Builder()
            .connectTimeout(CONNECT_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(WRITE_TIMEOUT, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build();

    // ====================== 同步GET请求 ======================
    /**
     * 同步GET请求
     * @param url 请求URL
     * @return 响应字符串
     * @throws IOException IO异常
     */
    public static String get(String url) throws IOException {
        Request request = new Request.Builder()
                .url(url)
                .build();
        try (Response response = HTTP_CLIENT.newCall(request).execute()) {
            return response.body() != null ? response.body().string() : null;
        }
    }

    /**
     * 同步GET请求，带请求头
     * @param url 请求URL
     * @param headers 请求头Map
     * @return 响应字符串
     * @throws IOException IO异常
     */
    public static String get(String url, Map<String, String> headers) throws IOException {
        Request.Builder builder = new Request.Builder().url(url);
        headers.forEach(builder::addHeader);
        Request request = builder.build();
        try (Response response = HTTP_CLIENT.newCall(request).execute()) {
            return response.body() != null ? response.body().string() : null;
        }
    }

    // ====================== 同步POST请求 ======================
    /**
     * 同步POST JSON请求
     * @param url 请求URL
     * @param jsonStr 请求体JSON字符串
     * @return 响应字符串
     * @throws IOException IO异常
     */
    public static String postJson(String url, String jsonStr) throws IOException {
        RequestBody body = RequestBody.create(jsonStr, JSON_MEDIA_TYPE);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
        try (Response response = HTTP_CLIENT.newCall(request).execute()) {
            return response.body() != null ? response.body().string() : null;
        }
    }

    /**
     * 同步POST JSON请求，带请求头
     * @param url 请求URL
     * @param headers 请求头Map
     * @param jsonStr 请求体JSON字符串
     * @return 响应字符串
     * @throws IOException IO异常
     */
    public static String postJson(String url, Map<String, String> headers, String jsonStr) throws IOException {
        RequestBody body = RequestBody.create(jsonStr, JSON_MEDIA_TYPE);
        Request.Builder builder = new Request.Builder().url(url).post(body);
        headers.forEach(builder::addHeader);
        Request request = builder.build();
        try (Response response = HTTP_CLIENT.newCall(request).execute()) {
            return response.body() != null ? response.body().string() : null;
        }
    }

    // ====================== 异步POST请求（用于Agent上报，不阻塞主线程） ======================
    /**
     * 异步POST JSON请求，无回调（适合上报场景，不需要关心结果）
     * @param url 请求URL
     * @param jsonStr 请求体JSON字符串
     */
    public static void asyncPostJson(String url, String jsonStr) {
        RequestBody body = RequestBody.create(jsonStr, JSON_MEDIA_TYPE);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
        HTTP_CLIENT.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                // 上报失败可做重试逻辑，这里简单忽略
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                // 上报成功不需要处理，关闭响应即可
                response.close();
            }
        });
    }

    /**
     * 异步POST JSON请求，带回调
     * @param url 请求URL
     * @param jsonStr 请求体JSON字符串
     * @param callback 回调接口
     */
    public static void asyncPostJson(String url, String jsonStr, Callback callback) {
        RequestBody body = RequestBody.create(jsonStr, JSON_MEDIA_TYPE);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
        HTTP_CLIENT.newCall(request).enqueue(callback);
    }

    // ====================== 获取OkHttpClient实例 ======================
    /**
     * 获取全局OkHttpClient实例，方便自定义配置
     * @return OkHttpClient实例
     */
    public static OkHttpClient getHttpClient() {
        return HTTP_CLIENT;
    }
}
