package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.core.Log;

import java.util.List;
import java.util.Optional;

/**
 * Log仓储接口
 * 定义Log数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/15
 */
public interface LogRepository {
    
    /**
     * 批量保存Log数据
     * 
     * @param logs Log实体列表
     */
    void saveLogs(List<Log> logs);
    
    /**
     * 根据ID查询Log
     * 
     * @param id Log ID
     * @return Log实体
     */
    Optional<Log> findById(String id);
    
    /**
     * 根据GID查询Log列表
     * 
     * @param gid 全局追踪ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Log列表
     */
    List<Log> findByGid(String gid, long beginMs, long endMs, int max);
    
    /**
     * 根据Span ID查询Log列表
     * 
     * @param spanId Span ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @return Log列表
     */
    List<Log> findBySpanId(String spanId, long beginMs, long endMs);
    
    /**
     * 按级别统计Log数量
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @param level 日志级别
     * @return 数量
     */
    long countByLevel(long beginMs, long endMs, String level);
    
    /**
     * 清理过期数据
     * 
     * @param retentionDays 保留天数
     */
    void clean(int retentionDays);
}
