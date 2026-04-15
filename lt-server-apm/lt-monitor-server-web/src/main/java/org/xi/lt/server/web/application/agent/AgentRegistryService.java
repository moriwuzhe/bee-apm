package org.xi.lt.server.web.application.agent;

import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.agent.AgentHeartbeatResult;
import org.xi.lt.server.domain.model.agent.AgentPullConfigResult;
import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;
import org.xi.lt.server.web.interfaces.http.api.dto.AgentConfigUpdateRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AgentRegistryService {
    private static final Map agentRegistry = new ConcurrentHashMap();
    private static final Map appConfigVersions = new ConcurrentHashMap();
    private static final Map appConfigs = new ConcurrentHashMap();

    public AgentHeartbeatResult heartbeat(AgentInstanceInfo info) {
        info.setLastHeartbeatTime(System.currentTimeMillis());
        String app = info.getApp();
        Object instMapObj = agentRegistry.get(app);
        if (!(instMapObj instanceof Map)) {
            instMapObj = new ConcurrentHashMap();
            agentRegistry.put(app, instMapObj);
        }
        ((Map) instMapObj).put(info.getInst(), info);

        AgentHeartbeatResult response = new AgentHeartbeatResult();

        String latestVersion = String.valueOf(appConfigVersions.getOrDefault(info.getApp(), "0"));
        if (!latestVersion.equals(info.getConfigVersion())) {
            response.setNewConfigVersion(latestVersion);
            response.setHasNewConfig(true);
        } else {
            response.setHasNewConfig(false);
        }
        return response;
    }

    public AgentPullConfigResult pullConfig(String app) {
        AgentPullConfigResult response = new AgentPullConfigResult();
        String config = app == null ? null : (String) appConfigs.get(app);
        if (config != null) {
            response.setConfig(config);
            response.setVersion((String) appConfigVersions.get(app));
        } else {
            response.setConfig("");
            response.setVersion("0");
        }
        return response;
    }

    public List<AgentInstanceInfo> getInstances() {
        List<AgentInstanceInfo> allInstances = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (Object e : agentRegistry.entrySet()) {
            Map.Entry entry = (Map.Entry) e;
            Object instMapObj = entry.getValue();
            if (!(instMapObj instanceof Map)) continue;
            for (Object v : ((Map) instMapObj).values()) {
                if (!(v instanceof AgentInstanceInfo)) continue;
                AgentInstanceInfo info = (AgentInstanceInfo) v;
                info.setOnline(now - info.getLastHeartbeatTime() < 90000);
                allInstances.add(info);
            }
        }

        return allInstances;
    }

    public void updateConfig(AgentConfigUpdateRequest payload) {
        String app = payload == null ? null : payload.getApp();
        String config = payload == null ? null : payload.getConfig();
        if (app != null && config != null) {
            appConfigs.put(app, config);
            appConfigVersions.put(app, UUID.randomUUID().toString());
        }
    }
}
