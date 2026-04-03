package com.bistoury.service;

import com.bistoury.entity.Alert;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 告警服务
 */
public interface AlertService {
    /**
     * 创建告警
     */
    Alert createAlert(Alert alert);

    /**
     * 处理告警
     */
    Alert resolveAlert(String alertId, String resolveUser, String remark);

    /**
     * 忽略告警
     */
    Alert ignoreAlert(String alertId, String remark);

    /**
     * 查询告警列表
     * @param level 告警级别过滤
     * @param status 状态过滤
     * @param agentId 关联Agent过滤
     * @param start 开始时间
     * @param end 结束时间
     */
    List<Alert> listAlerts(String level, String status, String agentId, Date start, Date end);

    /**
     * 获取告警统计
     */
    Map<String, Long> getAlertStats();

    /**
     * 获取未处理告警数量
     */
    Long getPendingAlertCount();

    /**
     * 检查Agent指标并触发告警
     * @param agentId Agent ID
     * @param metrics 指标数据
     */
    void checkAndTriggerAlerts(String agentId, Map<String, Object> metrics);
}
