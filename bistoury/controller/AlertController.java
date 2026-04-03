package com.bistoury.controller;

import com.bistoury.entity.Alert;
import com.bistoury.service.AlertService;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 告警中心控制器
 */
@RestController
@RequestMapping("/api/alert")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AlertController {

    @Resource
    private AlertService alertService;

    /**
     * 查询告警列表
     * @param level 告警级别过滤（可选）
     * @param status 状态过滤（可选）
     * @param agentId 关联Agent过滤（可选）
     * @param startTime 开始时间戳（可选）
     * @param endTime 结束时间戳（可选）
     */
    @GetMapping("/list")
    public List<Alert> listAlerts(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String agentId,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime) {
        
        Date start = startTime != null ? new Date(startTime) : null;
        Date end = endTime != null ? new Date(endTime) : null;
        
        return alertService.listAlerts(level, status, agentId, start, end);
    }

    /**
     * 获取告警统计
     */
    @GetMapping("/stats")
    public Map<String, Long> getAlertStats() {
        return alertService.getAlertStats();
    }

    /**
     * 获取未处理告警数量
     */
    @GetMapping("/pending/count")
    public Long getPendingAlertCount() {
        return alertService.getPendingAlertCount();
    }

    /**
     * 处理告警（标记为已解决）
     */
    @PostMapping("/resolve/{alertId}")
    public Alert resolveAlert(
            @PathVariable String alertId,
            @RequestParam String resolveUser,
            @RequestParam(required = false) String remark) {
        return alertService.resolveAlert(alertId, resolveUser, remark);
    }

    /**
     * 忽略告警
     */
    @PostMapping("/ignore/{alertId}")
    public Alert ignoreAlert(
            @PathVariable String alertId,
            @RequestParam(required = false) String remark) {
        return alertService.ignoreAlert(alertId, remark);
    }

    /**
     * 创建测试告警（调试用）
     */
    @PostMapping("/test")
    public Alert createTestAlert() {
        Alert alert = new Alert();
        alert.setLevel("warning");
        alert.setType("jvm");
        alert.setTitle("测试告警：堆内存过高");
        alert.setContent("测试告警内容：堆内存使用率已达85%，超过阈值80%");
        alert.setAgentId("agent-1");
        alert.setAppName("订单服务");
        alert.setTags(new String[]{"jvm", "memory", "test"});
        
        return alertService.createAlert(alert);
    }
}
