package org.xi.lt.demo.load;

import com.alibaba.fastjson.JSON;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.xi.lt.demo.common.Config;
import org.xi.lt.demo.model.RequestVo;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

@Component
public class PreprodLoadRunner {
    private static final Logger log = LoggerFactory.getLogger(PreprodLoadRunner.class);
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json;charset=UTF-8");

    @Value("${bee.demo.load.enable:false}")
    private boolean enable;

    @Value("${bee.demo.load.qps:5}")
    private int qps;

    @Value("${bee.demo.load.threads:2}")
    private int threads;

    @Value("${bee.demo.load.durationSeconds:0}")
    private int durationSeconds;

    @Value("${bee.demo.load.entryPath:/hello/sayHello}")
    private String entryPath;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!enable) {
            return;
        }
        int t = Math.max(1, threads);
        int q = Math.max(1, qps);
        ExecutorService pool = Executors.newFixedThreadPool(t);
        for (int i = 0; i < t; i++) {
            pool.submit(() -> runLoop(q, durationSeconds));
        }
    }

    private void runLoop(int qps, int durationSeconds) {
        long start = System.currentTimeMillis();
        long end = durationSeconds > 0 ? start + TimeUnit.SECONDS.toMillis(durationSeconds) : Long.MAX_VALUE;
        long intervalMs = Math.max(1, 1000L / qps);
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
        String url = String.format("http://127.0.0.1:%s%s", System.getProperty("server.port", "8101"), entryPath);
        while (System.currentTimeMillis() < end && !Thread.currentThread().isInterrupted()) {
            long ts = System.currentTimeMillis();
            try {
                RequestVo vo = new RequestVo();
                vo.setCounter(0);
                vo.setMsg("load-" + Config.instName() + "-" + RandomStringUtils.randomAlphanumeric(8));
                vo.setData(ThreadLocalRandom.current().nextInt(1, 1000000));
                String body = JSON.toJSONString(vo);
                Request request = new Request.Builder()
                        .url(url)
                        .post(RequestBody.create(JSON_MEDIA_TYPE, body))
                        .build();
                try (Response response = client.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        log.warn("load-request failed, code={}, url={}", response.code(), url);
                    }
                }
            } catch (Exception e) {
                log.warn("load-request error, url={}", url, e);
            } finally {
                long spend = System.currentTimeMillis() - ts;
                long sleep = intervalMs - spend;
                if (sleep > 0) {
                    try {
                        Thread.sleep(sleep);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
    }
}

