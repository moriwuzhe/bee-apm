package org.xi.lt.server.web.domain.model.agent;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentHeartbeatResult {
    private boolean hasNewConfig;
    private String newConfigVersion;

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
}
