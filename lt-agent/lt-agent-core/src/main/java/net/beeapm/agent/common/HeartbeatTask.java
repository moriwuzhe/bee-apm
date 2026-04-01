package org.xi.lt.agent.common;

import org.xi.lt.agent.Version;
import org.xi.lt.agent.config.BeeConfig;
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

public class HeartbeatTask {
    private static final String THREAD_NAME = "heartbeat";
    private static ScheduledExecutorService service = new ScheduledThreadPoolExecutor(1, new BeeThreadFactory(THREAD_NAME));

    public static String id;

    public static void start() {
        int period = BeeConfig.me().getHeartbeatPeriod();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                Span span = new Span(SpanType.HEARTBEAT);
                span.setId(getId());
                BeeConfig.me().fillEnvInfo(span);
                span.setTime(new Date());
                span.addTag("version", Version.VERSION);
                ReporterFactory.report(span);
            }
        }, 0, period, TimeUnit.SECONDS);
    }


    public static void shutdown() {
        BeeUtils.shutdown(service);
    }

    private static String getId() {
        if (id != null) {
            return id;
        }
        id = BeeConfig.me().getEnv() + "_" + BeeConfig.me().getApp() + "_" + BeeConfig.me().getInst() + "_" + BeeConfig.me().getPort();
        return id;
    }
}
