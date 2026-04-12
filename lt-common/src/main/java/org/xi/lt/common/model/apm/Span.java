package org.xi.lt.common.model.apm;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Span数据模型，调用链追踪核心数据结构
 * 参考OpenTelemetry规范设计，精简高效适合Agent采集上报
 */
public class Span implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 链路追踪ID，全局唯一
     */
    private String traceId;

    /**
     * 当前Span ID，单个链路内唯一
     */
    private String spanId;

    /**
     * 父Span ID，根Span为0
     */
    private String parentSpanId;

    /**
     * 应用ID
     */
    private String appId;

    /**
     * 租户ID
     */
    private String tenantId;

    /**
     * 服务名/应用名
     */
    private String serviceName;

    /**
     * 操作名/接口名
     */
    private String operationName;

    /**
     * Span类型：servlet/http/jdbc/redis/method等
     */
    private String type;

    /**
     * 开始时间戳（毫秒）
     */
    private long startTime;

    /**
     * 耗时（毫秒）
     */
    private long duration;

    /**
     * 端点IP：服务端IP
     */
    private String ip;

    /**
     * 端口号
     */
    private Integer port;

    /**
     * 标签集合，存储自定义属性：请求参数、返回值、异常信息等
     */
    private Map<String, Object> tags;

    /**
     * 日志事件集合，存储中间日志信息
     */
    private List<LogEvent> logs;

    /**
     * 是否有异常：0-正常，1-异常
     */
    private Integer hasError;

    /**
     * 异常信息
     */
    private String errorMsg;

    /**
     * 链路层级
     */
    private Integer level;

    public Span() {
        this.tags = new ConcurrentHashMap<>();
        this.logs = new ArrayList<>();
        this.hasError = 0;
        this.level = 0;
    }

    /**
     * 添加标签
     * @param key 标签key
     * @param value 标签value
     * @return 当前Span对象
     */
    public Span tag(String key, Object value) {
        if (key != null && value != null) {
            this.tags.put(key, value);
        }
        return this;
    }

    /**
     * 添加日志事件
     * @param event 日志事件
     * @return 当前Span对象
     */
    public Span log(LogEvent event) {
        if (event != null) {
            this.logs.add(event);
        }
        return this;
    }

    /**
     * 标记异常
     * @param errorMsg 异常信息
     * @return 当前Span对象
     */
    public Span error(String errorMsg) {
        this.hasError = 1;
        this.errorMsg = errorMsg;
        return this;
    }

    // ====================== Getter & Setter ======================
    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getSpanId() {
        return spanId;
    }

    public void setSpanId(String spanId) {
        this.spanId = spanId;
    }

    public String getParentSpanId() {
        return parentSpanId;
    }

    public void setParentSpanId(String parentSpanId) {
        this.parentSpanId = parentSpanId;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getOperationName() {
        return operationName;
    }

    public void setOperationName(String operationName) {
        this.operationName = operationName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Map<String, Object> getTags() {
        return tags;
    }

    public void setTags(Map<String, Object> tags) {
        this.tags = tags;
    }

    public List<LogEvent> getLogs() {
        return logs;
    }

    public void setLogs(List<LogEvent> logs) {
        this.logs = logs;
    }

    public Integer getHasError() {
        return hasError;
    }

    public void setHasError(Integer hasError) {
        this.hasError = hasError;
    }

    public String getErrorMsg() {
        return errorMsg;
    }

    public void setErrorMsg(String errorMsg) {
        this.errorMsg = errorMsg;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }
}
