package org.xi.lt.server.domain.model.alert;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 告警规则实体
 */
public class AlertRule implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String ruleName;              // 规则名称
    private String appCode;               // 应用代码（*表示所有应用）
    private String metricName;            // 监控指标名称
    private String operator;              // 操作符: >, <, >=, <=, ==
    private Double threshold;             // 阈值
    private Integer duration;             // 持续时间（秒），连续N秒超过阈值才告警
    private String severity;              // 严重程度: INFO, WARNING, CRITICAL
    private String notificationType;      // 通知类型: EMAIL, SMS, WEBHOOK
    private String notificationTarget;    // 通知目标
    private Boolean enabled;              // 是否启用
    private LocalDateTime createTime;     // 创建时间
    private LocalDateTime updateTime;     // 更新时间
    private String description;           // 规则描述

    public AlertRule() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    
    public String getAppCode() { return appCode; }
    public void setAppCode(String appCode) { this.appCode = appCode; }
    
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    
    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }
    
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    
    public String getNotificationTarget() { return notificationTarget; }
    public void setNotificationTarget(String notificationTarget) { this.notificationTarget = notificationTarget; }
    
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
