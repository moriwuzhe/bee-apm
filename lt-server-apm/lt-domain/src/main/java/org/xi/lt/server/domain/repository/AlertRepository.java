package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.core.Alert;

import java.util.List;
import java.util.Optional;

/**
 * Alert仓储接口
 * 定义Alert数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/15
 */
public interface AlertRepository {
    
    /**
     * 批量保存Alert数据
     * 
     * @param alerts Alert实体列表
     */
    void saveAlerts(List<Alert> alerts);
    
    /**
     * 根据ID查询Alert
     * 
     * @param id Alert ID
     * @return Alert实体
     */
    Optional<Alert> findById(String id);
    
    /**
     * 根据应用查询Alert列表
     * 
     * @param app 应用名称
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Alert列表
     */
    List<Alert> findByApp(String app, long beginMs, long endMs, int max);
    
    /**
     * 根据告警类型查询
     * 
     * @param alertType 告警类型
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @return Alert列表
     */
    List<Alert> findByAlertType(String alertType, long beginMs, long endMs);
    
    /**
     * 根据状态查询Alert
     * 
     * @param status 告警状态
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @return Alert列表
     */
    List<Alert> findByStatus(String status, long beginMs, long endMs);
    
    /**
     * 统计告警数量
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @param app 应用
     * @param alertType 告警类型
     * @return 数量
     */
    long countByType(long beginMs, long endMs, String app, String alertType);
    
    /**
     * 清理过期数据
     * 
     * @param retentionDays 保留天数
     */
    void clean(int retentionDays);
}
