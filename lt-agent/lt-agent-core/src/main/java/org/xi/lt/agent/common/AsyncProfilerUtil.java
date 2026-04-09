package org.xi.lt.agent.common;

import one.profiler.AsyncProfiler;
import one.profiler.AsyncProfilerLoader;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;

import java.io.File;

public class AsyncProfilerUtil {

    private static final ILog log = LogFactory.getLog(AsyncProfilerUtil.class.getSimpleName());
    private static AsyncProfiler profiler;
    private static volatile boolean isLoaded = false;

    static {
        try {
            profiler = AsyncProfilerLoader.load();
            isLoaded = true;
            log.info("AsyncProfiler loaded successfully.");
        } catch (Throwable t) {
            log.error("Failed to load AsyncProfiler", t);
        }
    }

    public static boolean isLoaded() {
        return isLoaded;
    }

    public static String execute(String command) {
        if (!isLoaded) {
            return "Error: AsyncProfiler is not loaded";
        }
        try {
            return profiler.execute(command);
        } catch (Exception e) {
            log.error("Error executing async-profiler command: " + command, e);
            return "Error: " + e.getMessage();
        }
    }
}
