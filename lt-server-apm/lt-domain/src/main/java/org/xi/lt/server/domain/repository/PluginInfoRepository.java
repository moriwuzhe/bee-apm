package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.plugin.PluginInfo;

import java.util.List;

/**
 * PluginInfo仓储接口
 * 插件信息数据的存储和查询契约
 * 
 * @author system
 * @date 2026/04/16
 */
public interface PluginInfoRepository {
    
    /**
     * 插入插件信息
     * 
     * @param pluginInfo 插件信息实体
     * @return 影响行数
     */
    int insert(PluginInfo pluginInfo);
    
    /**
     * 更新插件信息
     * 
     * @param pluginInfo 插件信息实体
     * @return 影响行数
     */
    int update(PluginInfo pluginInfo);
    
    /**
     * 根据插件编码查询
     * 
     * @param pluginCode 插件编码
     * @return 插件信息实体
     */
    PluginInfo findByPluginCode(String pluginCode);
    
    /**
     * 查询所有启用的插件
     * 
     * @return 插件信息列表
     */
    List<PluginInfo> findAllEnabled();
    
    /**
     * 查询所有插件
     * 
     * @return 插件信息列表
     */
    List<PluginInfo> findAll();
}
