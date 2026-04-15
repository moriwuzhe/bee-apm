package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;

import java.util.List;

/**
 * AgentInstance仓储接口
 * Agent实例数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/16
 */
public interface AgentInstanceRepository {
    
    /**
     * 插入Agent实例
     * 
     * @param agentInstance Agent实例实体
     * @return 影响行数
     */
    int insert(AgentInstanceInfo agentInstance);
    
    /**
     * 更新Agent实例
     * 
     * @param agentInstance Agent实例实体
     * @return 影响行数
     */
    int update(AgentInstanceInfo agentInstance);
    
    /**
     * 根据应用代码和实例ID查询
     * 
     * @param appCode 应用编码
     * @param instId 实例ID
     * @return Agent实例实体
     */
    AgentInstanceInfo findByAppCodeAndInstId(String appCode, String instId);
    
    /**
     * 查询所有Agent实例
     * 
     * @return Agent实例列表
     */
    List<AgentInstanceInfo> findAll();
}
