package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.alert.AlertRow;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.domain.model.common.PageSearchResult;
import org.xi.lt.server.domain.model.dashboard.FromToCount;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;

import java.util.List;

/**
 * 统一数据存储接口
 * 整合了写操作（IStore）和读操作（各种 QueryRepository）
 * 
 * @author system
 * @date 2026/04/15
 */
public interface UnifiedDataStore {
    
    /**
     * 初始化存储
     */
    void init();
    
    /**
     * 保存数据（写操作）
     * @param datas 数据对象数组
     */
    void save(Object... datas);
    
    /**
     * 清理过期数据
     * @param retentionDays 保留天数
     */
    void clean(int retentionDays);
    
    // ==================== Span 查询相关 ====================
    
    /**
     * 分页查询 Span
     * @param query 查询条件
     * @return 分页结果
     * @throws Exception 查询异常
     */
    PageSearchResult<SpanView> searchSpanPage(SpanPageQuery query) throws Exception;
    
    /**
     * 根据 GID 查询 Span 列表
     * @param type Span 类型
     * @param gid 全局追踪ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Span 列表
     * @throws Exception 查询异常
     */
    List<SpanView> searchSpanByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception;
    
    /**
     * 根据 GID 查询任意类型的 Span
     * @param gid 全局追踪ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Span 列表
     * @throws Exception 查询异常
     */
    List<SpanView> searchSpanByGidAny(String gid, long beginMs, long endMs, int max) throws Exception;
    
    // ==================== Alert 查询相关 ====================
    
    /**
     * 查询 Alert 列表
     * @param app 应用名称（可选）
     * @param limit 最大返回数量
     * @return Alert 列表
     * @throws Exception 查询异常
     */
    List<AlertRow> searchAlerts(String app, int limit) throws Exception;
    
    // ==================== Dashboard 查询相关 ====================
    
    /**
     * 按类型统计数据量
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param env 环境
     * @param app 应用
     * @param ip IP地址
     * @param type 数据类型
     * @return 数据量
     */
    long countByType(long beginMs, long endMs, String env, String app, String ip, String type);
    
    /**
     * 统计独立实例数
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param env 环境
     * @param app 应用
     * @param ip IP地址
     * @return 独立实例数
     */
    long countDistinctInst(long beginMs, long endMs, String env, String app, String ip);
    
    /**
     * 获取拓扑关系
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @return 调用关系列表
     */
    List<FromToCount> topologyFromTo(long beginMs, long endMs);
    
    // ==================== 通用查询相关 ====================
    
    /**
     * 分组统计
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param groupField 分组字段
     * @return 键值对列表
     */
    List<KeyValue> groupList(long beginMs, long endMs, String groupField);
    
    /**
     * 根据 ID 查询
     * @param indexPrefix 索引前缀
     * @param id 记录ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @return 查询结果
     */
    Object queryById(String indexPrefix, String id, long beginMs, long endMs);
}
