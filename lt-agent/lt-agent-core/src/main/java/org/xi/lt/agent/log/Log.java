package org.xi.lt.agent.log;

import org.xi.lt.agent.common.LtConst;
import org.xi.lt.agent.common.LtUtils;
import org.xi.lt.agent.config.LtConfig;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.regex.Matcher;

/**
 * 日志打印
 *
 * @author yuan
 * @date 2018/3/26.
 */
public class Log implements ILog {
    private String targetName;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    public Log(String targetName) {
        this.targetName = targetName;
    }

    protected void logger(LogLevel level, String message, Throwable e) {
        String msg = format(level, message, e);
        if (LtConfig.me().isLogConsole()) {
            System.out.println("[LtLog]: " + msg);
        }
        LogWriter.me().writeLog(msg);
    }

    private String replaceParam(String message, Object... parameters) {
        int startSize = 0;
        int parametersIndex = 0;
        int index;
        String tmpMessage = message;
        while ((index = message.indexOf("{}", startSize)) != -1) {
            if (parametersIndex >= parameters.length) {
                break;
            }
            tmpMessage = tmpMessage.replaceFirst("\\{\\}", Matcher.quoteReplacement(String.valueOf(parameters[parametersIndex++])));
            startSize = index + 2;
        }
        return tmpMessage;
    }

    String format(LogLevel level, String message, Throwable t) {
        return LtUtils.join("[", level.name(), "] ",
                dateFormat.format(new Date()),
                " ",
                targetName,
                " : ",
                message,
                t == null ? "" : format(t)
        );
    }

    String format(Throwable t) {
        return LtConst.LINE_SEPARATOR + LogUtil.format(t);
    }

    @Override
    public void trace(String format) {
        if (isTraceEnable()) {
            logger(LogLevel.TRACE, format, null);
        }
    }

    @Override
    public void trace(String format, Object... arguments) {
        if (isTraceEnable()) {
            logger(LogLevel.TRACE, replaceParam(format, arguments), null);
        }
    }

    @Override
    public void debug(String format) {
        if (isDebugEnable()) {
            logger(LogLevel.DEBUG, format, null);
        }
    }

    @Override
    public void debug(String format, Object... arguments) {
        if (isDebugEnable()) {
            logger(LogLevel.DEBUG, replaceParam(format, arguments), null);
        }
    }

    @Override
    public void info(String format) {
        if (isInfoEnable()) {
            logger(LogLevel.INFO, format, null);
        }
    }

    @Override
    public void info(String format, Object... arguments) {
        if (isInfoEnable()) {
            logger(LogLevel.INFO, replaceParam(format, arguments), null);
        }
    }

    @Override
    public void warn(String format, Object... arguments) {
        if (isWarnEnable()) {
            logger(LogLevel.WARN, replaceParam(format, arguments), null);
        }
    }

    @Override
    public void warn(Throwable e, String format, Object... arguments) {
        if (isWarnEnable()) {
            logger(LogLevel.WARN, replaceParam(format, arguments), e);
        }
    }

    @Override
    public void error(String format) {
        if (isErrorEnable()) {
            logger(LogLevel.ERROR, format, null);
        }
    }

    @Override
    public void error(String format, Throwable e) {
        if (isErrorEnable()) {
            logger(LogLevel.ERROR, format, e);
        }
    }

    @Override
    public void error(Throwable e, String format, Object... arguments) {
        if (isErrorEnable()) {
            logger(LogLevel.ERROR, replaceParam(format, arguments), e);
        }
    }

    @Override
    public void exec(String format) {
        if (isExecEnable()) {
            logger(LogLevel.EXEC, format, null);
        }
    }

    @Override
    public void exec(String format, Object... arguments) {
        if (isExecEnable()) {
            logger(LogLevel.EXEC, replaceParam(format, arguments), null);
        }
    }

    @Override
    public void exec(Throwable e, String format, Object... arguments) {
        if (isExecEnable()) {
            logger(LogLevel.EXEC, replaceParam(format, arguments), e);
        }
    }

    public boolean isDebugEnable() {
        return LogLevel.DEBUG.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }

    public static boolean isInfoEnable() {
        return LogLevel.INFO.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }

    public boolean isWarnEnable() {
        return LogLevel.WARN.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }

    public boolean isErrorEnable() {
        return LogLevel.ERROR.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }

    public boolean isTraceEnable() {
        return LogLevel.TRACE.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }

    public boolean isExecEnable() {
        return LogLevel.EXEC.ordinal() >= LtConfig.me().getLogLevel().ordinal();
    }
}
