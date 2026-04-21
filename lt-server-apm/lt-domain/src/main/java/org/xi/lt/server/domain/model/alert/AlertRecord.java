package org.xi.lt.server.domain.model.alert;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 告警记录实体
 */
public class AlertRecord implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long ruleId;                  // 关联的告警规则ID
    private String appCode;               // 应用代码
    private String instId;                // 实例ID
    private String metricName;            // 触发告警的指标
    private Double currentValue;          // 当前值
    private Double threshold;             // 阈值
    private String severity;              // 严重程度
    private String status;                // 状态: TRIGGERED, RESOLVED
    private LocalDateTime triggerTime;    // 触发时间
    private LocalDateTime resolveTime;    // 恢复时间
    private String message;               // 告警消息

    public AlertRecord() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getRuleId() { return ruleId; }
    public void setRuleId(Long ruleId) { this.ruleId = ruleId; }
    
    public String getAppCode() { return appCode; }
    public void setAppCode(String appCode) { this.appCode = appCode; }
    
    public String getInstId() { return instId; }
    public void setInstId(String instId) { this.instId = instId; }
    
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    
    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }
    
    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getTriggerTime() { return triggerTime; }
    public void setTriggerTime(LocalDateTime triggerTime) { this.triggerTime = triggerTime; }
    
    public LocalDateTime getResolveTime() { return resolveTime; }
    public void setResolveTime(LocalDateTime resolveTime) { this.resolveTime = resolveTime; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
