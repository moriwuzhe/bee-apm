package org.xi.lt.agent.common;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ID生成器 - 本地实现，不依赖ZooKeeper
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
public class IdHelper {
    private static String datePattern = "yyMMddHHmmss";
    private static SimpleDateFormat sdf = new SimpleDateFormat(datePattern);

    public volatile static String nodeName = "1001";
    public volatile static String timestamp = sdf.format(new Date());
    public volatile static String prevTimestamp = timestamp;
    public static AtomicLong id = new AtomicLong(1);
    private static ScheduledExecutorService service;
    private static final String THREAD_NAME = "id";

    static {
        service = new ScheduledThreadPoolExecutor(1, new LtThreadFactory(THREAD_NAME));
        // 随机生成节点ID，避免多实例冲突
        nodeName = String.valueOf(1000 + (int)(Math.random() * 8999));
    }

    public static void shutdown() {
        LtUtils.shutdown(service);
    }

    public static void init() {
        // 本地ID生成器，不需要ZK依赖
        initTimestamp();
    }

    private static void initTimestamp() {
        Calendar cal = Calendar.getInstance();
        timestamp = sdf.format(cal.getTime());
        prevTimestamp = timestamp;
        cal.set(Calendar.SECOND, cal.get(Calendar.SECOND) + 1);
        cal.set(Calendar.MILLISECOND, 0);
        long delay = cal.getTimeInMillis() - System.currentTimeMillis();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                timestamp = sdf.format(new Date());
            }
        }, delay, 1000, TimeUnit.MILLISECONDS);

    }

    public static String id() {
        if (!prevTimestamp.equals(timestamp)) {
            synchronized (IdHelper.class) {
                if (!prevTimestamp.equals(timestamp)) {
                    prevTimestamp = timestamp;
                    id.set(1);
                }
            }
        }
        return nodeName + prevTimestamp + id.getAndIncrement();
    }

    /**
     * 生成TraceId
     * @return TraceId
     */
    public static String traceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

}
