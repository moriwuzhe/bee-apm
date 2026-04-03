package com.bistoury.service.impl;

import com.bistoury.entity.Alert;
import com.bistoury.service.AlertService;
import com.bistoury.service.WebSocketService;
import org.springframework.stereotype.Service;
import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * 告警服务实现类（内存版本）
 */
@Service
public class AlertServiceImpl implements AlertService {

    private final Map<String, Alert> alertMap = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    @Resource
    private WebSocketService webSocketService;

    @Override
    public Alert createAlert(Alert alert) {
        // 生成告警ID
        String alertId = "alert-" + idGenerator.incrementAndGet();
        alert.setId(alertId);
        alert.setAlertTime(new Date());
        alert.setStatus("pending");
        
        alertMap.put(alertId, alert);
        
        // 推送告警通知到前端
        webSocketService.broadcastNotification(
                String.format("【%s告警】%s - %s", 
                        alert.getLevel().toUpperCase(), 
                        alert.getAppName(), 
                        alert.getTitle())
        );
        
        return alert;
    }

    @Override
    public Alert resolveAlert(String alertId, String resolveUser, String remark) {
        Alert alert = alertMap.get(alertId);
        if (alert != null) {
            alert.setStatus("resolved");
            alert.setResolveTime(new Date());
            alert.setResolveUser(resolveUser);
            alert.setRemark(remark);
        }
        return alert;
    }

    @Override
    public Alert ignoreAlert(String alertId, String remark) {
        Alert alert = alertMap.get(alertId);
        if (alert != null) {
            alert.setStatus("ignored");
            alert.setResolveTime(new Date());
            alert.setRemark(remark);
        }
        return alert;
    }

    @Override
    public List<Alert> listAlerts(String level, String status, String agentId, Date start, Date end) {
        return alertMap.values().stream()
                .filter(alert -> level == null || level.equals(alert.getLevel()))
                .filter(alert -> status == null || status.equals(alert.getStatus()))
                .filter(alert -> agentId == null || agentId.equals(alert.getAgentId()))
                .filter(alert -> start == null || alert.getAlertTime().after(start))
                .filter(alert -> end == null || alert.getAlertTime().before(end))
                .sorted((a, b) -> b.getAlertTime().compareTo(a.getAlertTime()))
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getAlertStats() {
        Map<String, Long> stats = new HashMap<>();
        long total = alertMap.size();
        long pending = alertMap.values().stream().filter(a -> "pending".equals(a.getStatus())).count();
        long warning = alertMap.values().stream().filter(a -> "warning".equals(a.getLevel())).count();
        long error = alertMap.values().stream().filter(a -> "error".equals(a.getLevel())).count();
        long critical = alertMap.values().stream().filter(a -> "critical".equals(a.getLevel())).count();
        
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("warning", warning);
        stats.put("error", error);
        stats.put("critical", critical);
        return stats;
    }

    @Override
    public Long getPendingAlertCount() {
        return alertMap.values().stream()
                .filter(a -> "pending".equals(a.getStatus()))
                .count();
    }

    @Override
    public void checkAndTriggerAlerts(String agentId, Map<String, Object> metrics) {
        // 模拟告警规则检查
        // 1. 检查堆内存使用率 > 80%触发告警
        Double heapUsage = (Double) metrics.getOrDefault("heapUsage", 0d);
        if (heapUsage > 80) {
            Alert alert = new Alert();
            alert.setLevel("warning");
            alert.setType("jvm");
            alert.setTitle("堆内存使用率过高");
            alert.setContent(String.format("应用堆内存使用率已达%.1f%%，超过阈值80%%", heapUsage));
            alert.setAgentId(agentId);
            alert.setAppName((String) metrics.getOrDefault("appName", "未知应用"));
            alert.setTags(new String[]{"jvm", "memory"});
            createAlert(alert);
        }
        
        // 2. 检查Full GC频率 > 5次/小时触发告警
        Integer fullGcCount = (Integer) metrics.getOrDefault("fullGcCount", 0);
        if (fullGcCount > 5) {
            Alert alert = new Alert();
            alert.setLevel("error");
            alert.setType("jvm");
            alert.setTitle("Full GC过于频繁");
            alert.setContent(String.format("最近1小时Full GC次数达%d次，超过阈值5次", fullGcCount));
            alert.setAgentId(agentId);
            alert.setAppName((String) metrics.getOrDefault("appName", "未知应用"));
            alert.setTags(new String[]{"jvm", "gc"});
            createAlert(alert);
        }
        
        // 3. 检查线程死锁
        Boolean hasDeadlock = (Boolean) metrics.getOrDefault("hasDeadlock", false);
        if (hasDeadlock) {
            Alert alert = new Alert();
            alert.setLevel("critical");
            alert.setType("thread");
            alert.setTitle("检测到线程死锁");
            alert.setContent("应用检测到线程死锁，服务可能无法正常响应请求！");
            alert.setAgentId(agentId);
            alert.setAppName((String) metrics.getOrDefault("appName", "未知应用"));
            alert.setTags(new String[]{"thread", "deadlock"});
            createAlert(alert);
        }
        
        // 4. 检查CPU使用率 > 90%触发告警
        Double cpuUsage = (Double) metrics.getOrDefault("cpuUsage", 0d);
        if (cpuUsage > 90) {
            Alert alert = new Alert();
            alert.setLevel("warning");
            alert.setType("system");
            alert.setTitle("CPU使用率过高");
            alert.setContent(String.format("系统CPU使用率已达%.1f%%，超过阈值90%%", cpuUsage));
            alert.setAgentId(agentId);
            alert.setAppName((String) metrics.getOrDefault("appName", "未知应用"));
            alert.setTags(new String[]{"system", "cpu"});
            createAlert(alert);
        }
    }
}
