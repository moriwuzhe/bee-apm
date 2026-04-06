package org.xi.lt.agent.log;


import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * 用于LT监控系统的log组件还没初始化前的日志打印，日志内容输出到{user.home}/logs/bee.log文件里，并输出到控制台中<br/>
 * 比如LT监控系统启动时候的日志输出<br/>
 * 其它地方请使用 LogFactory  获取 Log 对象进行日志打印<br/>
 *
 * @author yuan
 * @date 2019/12/19
 */
public class LogUtil {
    private static ILog emptyLog = new EmptyLog();
    private static ILog emptyHandlerLog;

    private static BufferedWriter writer;
    private static SimpleDateFormat dateFmt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static void init(String basePath) {
        if (writer != null) {
            return;
        }
        synchronized (LogUtil.class) {
            if (writer != null) {
                return;
            }
            try {
                String tmpDir = System.getProperty("java.io.tmpdir");
                if (tmpDir == null || tmpDir.trim().isEmpty()) {
                    tmpDir = System.getProperty("user.home");
                }
                String logDir = tmpDir + File.separator + "lt-monitor" + File.separator + "logs";
                File dir = new File(logDir);
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                String logPath = logDir + File.separator + "lt-agent.log";
                File logFile = new File(logPath);
                if (!logFile.exists()) {
                    logFile.createNewFile();
                }
                System.out.println("[LT Agent] log path=" + logPath);
                writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(logFile, true), "UTF-8"));
            } catch (Exception e) {
                e.printStackTrace();
                // 初始化失败，使用控制台输出，避免空指针
                try {
                    writer = new BufferedWriter(new OutputStreamWriter(System.out, "UTF-8"));
                } catch (Exception ex) {
                    writer = new BufferedWriter(new OutputStreamWriter(System.out));
                }
            }
        }
    }

    public static void log(String msg) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("[BEE][").append(dateFmt.format(new Date())).append("] ").append(msg);
            write(sb.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void log(String msg, Throwable t) {
        log(msg + " : " + format(t));
    }

    public static String format(Throwable t) {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        t.printStackTrace(new java.io.PrintWriter(buf, true));
        String expMessage = buf.toString();
        try {
            buf.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return expMessage;
    }

    public synchronized static void write(String msg) {
        try {
            msg = msg + "\n";
            System.out.print(msg);
            writer.write(msg);
            writer.flush();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void close() {
        try {
            writer.close();
        } catch (Exception e) {

        }
    }

    public static void setEmptyHandlerLog(ILog log) {
        emptyHandlerLog = log;
    }

    public static ILog getEmptyHandlerLog() {
        if (emptyHandlerLog != null) {
            return emptyHandlerLog;
        }
        return emptyLog;
    }

}
