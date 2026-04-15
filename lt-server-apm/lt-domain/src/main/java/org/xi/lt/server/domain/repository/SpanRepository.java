package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.common.PageSearchResult;
import org.xi.lt.server.domain.model.core.Span;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.domain.model.dashboard.FromToCount;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;

import java.util.List;

/**
 * Span仓储接口
 * 定义Span数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/15
 */
public interface SpanRepository {
    
    /**
     * 批量保存Span数据
     * 
     * @param spans Span实体列表
     */
    void saveSpans(List<Span> spans);
    
    /**
     * 分页查询Span
     * 
     * @param query 查询条件
     * @return 分页结果
     */
    PageSearchResult<SpanView> searchSpanPage(SpanPageQuery query) throws Exception;
    
    /**
     * 根据GID和类型查询Span
     * 
     * @param type 类型
     * @param gid 全局追踪ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Span视图列表
     */
    List<SpanView> searchByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception;
    
    /**
     * 根据GID查询任意类型的Span
     * 
     * @param gid 全局追踪ID
     * @param beginMs 开始时间（毫秒）
     * @param endMs 结束时间（毫秒）
     * @param max 最大返回数量
     * @return Span视图列表
     */
    List<SpanView> searchByGidAny(String gid, long beginMs, long endMs, int max) throws Exception;
    
    /**
     * 按类型计数
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @param env 环境
     * @param app 应用
     * @param ip IP地址
     * @param type 类型
     * @return 数量
     */
    long countByType(long beginMs, long endMs, String env, String app, String ip, String type);
    
    /**
     * 统计独立实例数
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @param env 环境
     * @param app 应用
     * @param ip IP地址
     * @return 独立实例数
     */
    long countDistinctInst(long beginMs, long endMs, String env, String app, String ip);
    
    /**
     * 查询拓扑关系
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @return 拓扑关系列表
     */
    List<FromToCount> topologyFromTo(long beginMs, long endMs);
    
    /**
     * 分组列表查询
     * 
     * @param beginMs 开始时间
     * @param endMs 结束时间
     * @param groupField 分组字段
     * @return 键值对列表
     */
    List<KeyValue> groupList(long beginMs, long endMs, String groupField);
    
    /**
     * 清理过期数据
     * 
     * @param retentionDays 保留天数
     */
    void clean(int retentionDays);
}
