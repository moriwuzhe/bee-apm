package org.xi.lt.server.domain.repository;

/**
 * AgentInstanceConfig仓储接口
 * Agent实例配置数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/16
 */
public interface AgentInstanceConfigRepository {
    
    /**
     * 插入Agent实例配置
     * 
     * @param appCode 应用编码
     * @param instId 实例ID
     * @param config 配置内容
     * @param configVersion 配置版本
     * @return 影响行数
     */
    int insert(String appCode, String instId, String config, String configVersion);
    
    /**
     * 更新Agent实例配置
     * 
     * @param appCode 应用编码
     * @param instId 实例ID
     * @param config 配置内容
     * @param configVersion 配置版本
     * @return 影响行数
     */
    int update(String appCode, String instId, String config, String configVersion);
    
    /**
     * 根据应用编码和实例ID查询配置
     * 
     * @param appCode 应用编码
     * @param instId 实例ID
     * @return 配置内容
     */
    String findConfigByAppCodeAndInstId(String appCode, String instId);
    
    /**
     * 根据应用编码和实例ID查询配置版本
     * 
     * @param appCode 应用编码
     * @param instId 实例ID
     * @return 配置版本
     */
    String findConfigVersionByAppCodeAndInstId(String appCode, String instId);
}
