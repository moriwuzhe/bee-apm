package org.xi.lt.common.model.apm;

import java.io.Serializable;
import java.util.Map;

/**
 * Span日志事件模型
 * 用于记录Span生命周期内的关键事件
 */
public class LogEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 事件时间戳（毫秒）
     */
    private long timestamp;

    /**
     * 事件字段集合
     */
    private Map<String, Object> fields;

    public LogEvent() {
    }

    public LogEvent(long timestamp, Map<String, Object> fields) {
        this.timestamp = timestamp;
        this.fields = fields;
    }

    public static LogEvent create(long timestamp, Map<String, Object> fields) {
        return new LogEvent(timestamp, fields);
    }

    // ====================== Getter & Setter ======================
    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getFields() {
        return fields;
    }

    public void setFields(Map<String, Object> fields) {
        this.fields = fields;
    }
}
