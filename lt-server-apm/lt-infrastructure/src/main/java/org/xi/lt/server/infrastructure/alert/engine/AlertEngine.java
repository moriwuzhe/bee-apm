package org.xi.lt.server.infrastructure.alert.engine;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.xi.lt.server.domain.model.agent.AgentMemoryMetrics;
import org.xi.lt.server.domain.model.alert.AlertRule;
import org.xi.lt.server.infrastructure.alert.repository.AlertRuleRepository;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 告警引擎 - 实时监控指标并触发告警
 */
@Component
public class AlertEngine {

    private static final Logger log = LoggerFactory.getLogger(AlertEngine.class);

    private final AlertRuleRepository alertRuleRepository;
    
    // 记录每个规则的连续触发次数：key = ruleId_appCode_instId, value = consecutive count
    private final Map<String, Integer> triggerCounters = new ConcurrentHashMap<>();

    public AlertEngine(AlertRuleRepository alertRuleRepository) {
        this.alertRuleRepository = alertRuleRepository;
    }

    @PostConstruct
    public void init() {
        log.info("Alert Engine initialized");
    }

    /**
     * 检查指标是否触发告警
     */
    public void checkMetrics(AgentMemoryMetrics metrics) {
        if (metrics == null || metrics.getAppCode() == null) {
            return;
        }

        List<AlertRule> rules = alertRuleRepository.findByAppCode(metrics.getAppCode());
        
        for (AlertRule rule : rules) {
            try {
                evaluateRule(rule, metrics);
            } catch (Exception e) {
                log.error("Failed to evaluate alert rule: {}", rule.getRuleName(), e);
            }
        }
    }

    /**
     * 评估单个告警规则
     */
    private void evaluateRule(AlertRule rule, AgentMemoryMetrics metrics) {
        // 获取指标值
        Double metricValue = getMetricValue(rule.getMetricName(), metrics);
        if (metricValue == null) {
            return;
        }

        // 判断是否满足条件
        boolean triggered = evaluateCondition(metricValue, rule.getOperator(), rule.getThreshold());
        
        String counterKey = rule.getId() + "_" + metrics.getAppCode() + "_" + metrics.getInstId();
        
        if (triggered) {
            // 增加连续触发计数
            int count = triggerCounters.getOrDefault(counterKey, 0) + 1;
            triggerCounters.put(counterKey, count);
            
            // 如果连续触发次数达到阈值，触发告警
            if (count >= rule.getDuration() / 30) { // 假设每30秒上报一次
                triggerAlert(rule, metrics, metricValue);
            }
        } else {
            // 重置计数器
            triggerCounters.remove(counterKey);
        }
    }

    /**
     * 获取指标值
     */
    private Double getMetricValue(String metricName, AgentMemoryMetrics metrics) {
        switch (metricName) {
            case "processCpuLoad":
                return metrics.getProcessCpuLoad() != null ? metrics.getProcessCpuLoad() * 100 : null;
            case "heapUsageRate":
                return metrics.getHeapMax() != null && metrics.getHeapMax() > 0 
                    ? (double) metrics.getHeapUsed() / metrics.getHeapMax() * 100 : null;
            case "performanceScore":
                return metrics.getPerformanceScore();
            case "gcPressure":
                return metrics.getGcPressure();
            case "classLoadingRate":
                return metrics.getClassLoadingRate();
            default:
                return null;
        }
    }

    /**
     * 评估条件
     */
    private boolean evaluateCondition(double value, String operator, double threshold) {
        switch (operator) {
            case ">":
                return value > threshold;
            case "<":
                return value < threshold;
            case ">=":
                return value >= threshold;
            case "<=":
                return value <= threshold;
            case "==":
                return Math.abs(value - threshold) < 0.001;
            default:
                return false;
        }
    }

    /**
     * 触发告警
     */
    private void triggerAlert(AlertRule rule, AgentMemoryMetrics metrics, double currentValue) {
        String message = String.format(
            "告警触发: %s\n应用: %s\n实例: %s\n指标: %s\n当前值: %.2f\n阈值: %s %.2f\n严重程度: %s",
            rule.getRuleName(),
            metrics.getAppCode(),
            metrics.getInstId(),
            rule.getMetricName(),
            currentValue,
            rule.getOperator(),
            rule.getThreshold(),
            rule.getSeverity()
        );
        
        log.warn("ALERT TRIGGERED: {}", message);
        
        // TODO: 发送通知（邮件、短信、Webhook等）
        sendNotification(rule, message);
    }

    /**
     * 发送通知
     */
    private void sendNotification(AlertRule rule, String message) {
        // 根据通知类型发送不同的通知
        switch (rule.getNotificationType()) {
            case "WEBHOOK":
                sendWebhook(rule.getNotificationTarget(), message);
                break;
            case "EMAIL":
                sendEmail(rule.getNotificationTarget(), message);
                break;
            case "SMS":
                sendSms(rule.getNotificationTarget(), message);
                break;
            default:
                log.info("Notification sent via {}: {}", rule.getNotificationType(), message);
        }
    }

    private void sendWebhook(String target, String message) {
        // TODO: 实现 Webhook 通知
        log.info("Sending webhook to {}: {}", target, message);
    }

    private void sendEmail(String target, String message) {
        // TODO: 实现邮件通知
        log.info("Sending email to {}: {}", target, message);
    }

    private void sendSms(String target, String message) {
        // TODO: 实现短信通知
        log.info("Sending SMS to {}: {}", target, message);
    }
}
