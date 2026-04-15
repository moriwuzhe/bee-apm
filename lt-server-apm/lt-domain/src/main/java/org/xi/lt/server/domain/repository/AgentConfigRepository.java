package org.xi.lt.server.domain.repository;

/**
 * AgentConfig仓储接口
 * Agent配置数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/16
 */
public interface AgentConfigRepository {
    
    /**
     * 插入Agent配置
     * 
     * @param appCode 应用编码
     * @param config 配置内容
     * @param configVersion 配置版本
     * @return 影响行数
     */
    int insert(String appCode, String config, String configVersion);
    
    /**
     * 更新Agent配置
     * 
     * @param appCode 应用编码
     * @param config 配置内容
     * @param configVersion 配置版本
     * @return 影响行数
     */
    int update(String appCode, String config, String configVersion);
    
    /**
     * 根据应用代码查询配置
     * 
     * @param appCode 应用编码
     * @return 配置内容
     */
    String findConfigByAppCode(String appCode);
    
    /**
     * 根据应用代码查询配置版本
     * 
     * @param appCode 应用编码
     * @return 配置版本
     */
    String findConfigVersionByAppCode(String appCode);
}
