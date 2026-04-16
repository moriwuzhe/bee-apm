package org.xi.lt.server.web.application.plugin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.plugin.PluginInfo;
import org.xi.lt.server.domain.repository.PluginInfoRepository;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 插件管理服务
 * 
 * @author system
 * @date 2026/04/16
 */
@Service
public class PluginRegistryService {
    
    // 内存缓存用于快速访问
    private static final Map<String, PluginInfo> pluginCache = new ConcurrentHashMap<>();

    @Autowired
    private PluginInfoRepository pluginInfoRepository;

    /**
     * 获取所有启用的插件列表
     */
    public List<PluginInfo> getAllEnabledPlugins() {
        List<PluginInfo> plugins = pluginInfoRepository.findAllEnabled();
        // 更新缓存
        for (PluginInfo plugin : plugins) {
            pluginCache.put(plugin.getPluginCode(), plugin);
        }
        return plugins;
    }

    /**
     * 获取所有插件列表
     */
    public List<PluginInfo> getAllPlugins() {
        List<PluginInfo> plugins = pluginInfoRepository.findAll();
        // 更新缓存
        for (PluginInfo plugin : plugins) {
            pluginCache.put(plugin.getPluginCode(), plugin);
        }
        return plugins;
    }

    /**
     * 根据插件编码获取插件信息
     */
    public PluginInfo getPluginByCode(String pluginCode) {
        // 先从缓存获取
        PluginInfo cached = pluginCache.get(pluginCode);
        if (cached != null) {
            return cached;
        }
        
        // 缓存未命中，从数据库获取
        PluginInfo plugin = pluginInfoRepository.findByPluginCode(pluginCode);
        if (plugin != null) {
            pluginCache.put(pluginCode, plugin);
        }
        return plugin;
    }

    /**
     * 注册新插件
     */
    public void registerPlugin(PluginInfo pluginInfo) {
        PluginInfo existing = pluginInfoRepository.findByPluginCode(pluginInfo.getPluginCode());
        if (existing == null) {
            pluginInfoRepository.insert(pluginInfo);
        } else {
            pluginInfo.setId(existing.getId());
            pluginInfoRepository.update(pluginInfo);
        }
        // 更新缓存
        pluginCache.put(pluginInfo.getPluginCode(), pluginInfo);
    }

    /**
     * 更新插件信息
     */
    public void updatePlugin(PluginInfo pluginInfo) {
        pluginInfoRepository.update(pluginInfo);
        // 更新缓存
        pluginCache.put(pluginInfo.getPluginCode(), pluginInfo);
    }

    /**
     * 获取插件的最后更新时间
     * 返回所有插件中最新的 updateTime（毫秒时间戳）
     */
    public long getPluginLastUpdateTime() {
        List<PluginInfo> plugins = getAllPlugins();
        long lastUpdateTime = 0;
        
        for (PluginInfo plugin : plugins) {
            if (plugin.getUpdateTime() != null) {
                long updateTime = plugin.getUpdateTime().getTime();
                if (updateTime > lastUpdateTime) {
                    lastUpdateTime = updateTime;
                }
            }
        }
        
        return lastUpdateTime;
    }
}
