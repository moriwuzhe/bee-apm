package org.xi.lt.server.domain.model.plugin;

import java.util.List;

/**
 * 插件列表结果
 * 
 * @author system
 * @date 2026/04/16
 */
public class PluginListResult {
    private List<PluginInfo> plugins;
    private long lastUpdateTime;

    public List<PluginInfo> getPlugins() {
        return plugins;
    }

    public void setPlugins(List<PluginInfo> plugins) {
        this.plugins = plugins;
    }

    public long getLastUpdateTime() {
        return lastUpdateTime;
    }

    public void setLastUpdateTime(long lastUpdateTime) {
        this.lastUpdateTime = lastUpdateTime;
    }
}
