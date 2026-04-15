package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.config.Project;

import java.util.List;

/**
 * Project仓储接口
 * 项目配置数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/15
 */
public interface ProjectRepository {
    
    /**
     * 插入项目
     * 
     * @param project 项目实体
     * @return 影响行数
     */
    int insert(Project project);
    
    /**
     * 根据项目编码查询
     * 
     * @param projectCode 项目编码
     * @return 项目实体
     */
    Project findByProjectCode(String projectCode);
    
    /**
     * 查询所有项目
     * 
     * @return 项目列表
     */
    List<Project> findAll();
}
