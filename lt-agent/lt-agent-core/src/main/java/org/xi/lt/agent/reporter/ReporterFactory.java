package org.xi.lt.agent.reporter;

import com.alibaba.fastjson.JSON;
import org.xi.lt.agent.common.LtThreadFactory;
import org.xi.lt.agent.common.LtUtils;
import org.xi.lt.agent.config.ConfigUtils;
import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * @author yuan
 * @date 2018/08/06
 */
public class ReporterFactory {
    private static final ILog log = LogFactory.getLog(ReporterFactory.class.getSimpleName());
    public static AbstractReporter reporter;
    public static Map<String, AbstractReporter> reporterMap;
    private static BlockingQueue<Span> queue;
    private static ScheduledExecutorService scheduledExecutorService;
    private static String reporterName;
    private static int idleSleep = ConfigUtils.me().getInt("reporter.idleSleep", 100);
    private static int batchSize = ConfigUtils.me().getInt("reporter.batchSize", 100);
    private static final String REPORTER_THREAD_NAME = "reporter";

    public static void shutdown() {
        LtUtils.shutdown(scheduledExecutorService);
    }

    public synchronized static int init() {
        LogUtil.log("===========================>ReporterFactory::init");
        int threadNum = ConfigUtils.me().getInt("reporter.threadNum", 1);
        scheduledExecutorService = new ScheduledThreadPoolExecutor(threadNum, new LtThreadFactory(REPORTER_THREAD_NAME));
        if (reporterMap == null) {
            // 优先使用配置的reporter，默认用okhttp
            reporterName = ConfigUtils.me().getStr("reporter.type", ConfigUtils.me().getStr("type", "okhttp"));
            reporterMap = ReporterLoader.loadReporters();
            reporter = reporterMap.get(reporterName);
            if (reporter == null) {
                LogUtil.log("===========================>reporter：" + reporterName + "不存在，使用默认ConsoleReporter");
                reporter = new ConsoleReporter();
            }
            // 读取上报地址配置
            String serverUrl = ConfigUtils.me().getStr("reporter.serverUrl", ConfigUtils.me().getStr("agent.report.url", ConfigUtils.me().getStr("serverUrl", "http://127.0.0.1:8080/apm/report")));
            System.setProperty("lt.agent.report.url", serverUrl);
            reporter.init();
            initQueue();
            initTask(threadNum);
        }
        return 0;
    }

    private static void initQueue() {
        int queueSize = ConfigUtils.me().getInt("reporter.queueSize", 1000);
        queue = new LinkedBlockingQueue<Span>(queueSize);
    }

    private static void initTask(int threadNum) {
        for (int i = 0; i < threadNum; i++) {
            scheduledExecutorService.submit(new Runnable() {
                @Override
                public void run() {
                    while (!Thread.currentThread().isInterrupted()) {
                        doReport();
                    }
                }
            });
        }
    }

    public static void doReport() {
        try {
            if (queue.isEmpty()) {
                Thread.sleep(idleSleep);
                return;
            }
            List<Span> list = new ArrayList<Span>(batchSize);
            queue.drainTo(list, batchSize);
            reporter.report(list);
        } catch (Exception e) {
            log.error("", e);
        }
    }

    public static void report(Span span) {
        if (ConfigUtils.me().getBoolean("reporter.log", false)) {
            log.debug(JSON.toJSONString(span));
        }
        //如果队列已满，则返回false
        if (!queue.offer(span)) {
            log.warn("report queue is full.");
        }
    }
}
