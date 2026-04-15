package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.config.Application;

import java.util.List;

/**
 * Application仓储接口
 * 应用配置数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/15
 */
public interface ApplicationRepository {
    
    /**
     * 插入应用
     * 
     * @param app 应用实体
     * @return 影响行数
     */
    int insert(Application app);
    
    /**
     * 根据应用编码查询
     * 
     * @param appCode 应用编码
     * @return 应用实体
     */
    Application findByAppCode(String appCode);
    
    /**
     * 根据项目编码查询应用列表
     * 
     * @param projectCode 项目编码
     * @return 应用列表
     */
    List<Application> findByProjectCode(String projectCode);
    
    /**
     * 查询所有应用
     * 
     * @return 应用列表
     */
    List<Application> findAll();
}
