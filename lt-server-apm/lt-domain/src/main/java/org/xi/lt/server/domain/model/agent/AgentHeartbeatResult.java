package org.xi.lt.server.domain.model.agent;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentHeartbeatResult {
    private boolean hasNewConfig;
    private String newConfigVersion;
    private boolean hasNewPlugins;
    private long pluginLastUpdateTime;

    public boolean isHasNewConfig() {
        return hasNewConfig;
    }

    public void setHasNewConfig(boolean hasNewConfig) {
        this.hasNewConfig = hasNewConfig;
    }

    public String getNewConfigVersion() {
        return newConfigVersion;
    }

    public void setNewConfigVersion(String newConfigVersion) {
        this.newConfigVersion = newConfigVersion;
    }

    public boolean isHasNewPlugins() {
        return hasNewPlugins;
    }

    public void setHasNewPlugins(boolean hasNewPlugins) {
        this.hasNewPlugins = hasNewPlugins;
    }

    public long getPluginLastUpdateTime() {
        return pluginLastUpdateTime;
    }

    public void setPluginLastUpdateTime(long pluginLastUpdateTime) {
        this.pluginLastUpdateTime = pluginLastUpdateTime;
    }
}
