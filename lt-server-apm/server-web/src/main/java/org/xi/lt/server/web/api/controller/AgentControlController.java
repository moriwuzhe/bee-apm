package org.xi.lt.server.web.api.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/agent")
public class AgentControlController {

    // Store agent heartbeats in memory: Map<app, Map<inst, AgentInstanceInfo>>
    private static final Map<String, Map<String, AgentInstanceInfo>> agentRegistry = new ConcurrentHashMap<>();

    // Mock configuration store: Map<app, configVersion>
    private static final Map<String, String> appConfigVersions = new ConcurrentHashMap<>();
    // Map<app, configContent>
    private static final Map<String, String> appConfigs = new ConcurrentHashMap<>();

    @PostMapping("/heartbeat")
    public Map<String, Object> heartbeat(@RequestBody AgentInstanceInfo info) {
        info.setLastHeartbeatTime(System.currentTimeMillis());
        
        agentRegistry.computeIfAbsent(info.getApp(), k -> new ConcurrentHashMap<>())
                     .put(info.getInst(), info);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 0);
        response.put("msg", "success");
        
        // Check if config version is outdated
        String latestVersion = appConfigVersions.getOrDefault(info.getApp(), "0");
        if (!latestVersion.equals(info.getConfigVersion())) {
            response.put("newConfigVersion", latestVersion);
            response.put("hasNewConfig", true);
        } else {
            response.put("hasNewConfig", false);
        }

        return response;
    }

    @GetMapping("/config/pull")
    public Map<String, Object> pullConfig(@RequestParam("app") String app, @RequestParam("inst") String inst) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 0);
        String config = appConfigs.get(app);
        if (config != null) {
            response.put("config", config);
            response.put("version", appConfigVersions.get(app));
        } else {
            response.put("config", "");
            response.put("version", "0");
        }
        return response;
    }

    @GetMapping("/instances")
    public Map<String, Object> getInstances() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 0);
        
        List<AgentInstanceInfo> allInstances = new ArrayList<>();
        long now = System.currentTimeMillis();
        
        agentRegistry.forEach((app, instMap) -> {
            instMap.values().forEach(info -> {
                // Determine online status (e.g., heartbeat within last 90 seconds)
                info.setOnline(now - info.getLastHeartbeatTime() < 90000);
                allInstances.add(info);
            });
        });
        
        response.put("data", allInstances);
        return response;
    }
    
    // For UI to update config
    @PostMapping("/config/update")
    public Map<String, Object> updateConfig(@RequestBody Map<String, String> payload) {
        String app = payload.get("app");
        String config = payload.get("config");
        if (app != null && config != null) {
            appConfigs.put(app, config);
            appConfigVersions.put(app, UUID.randomUUID().toString());
        }
        Map<String, Object> response = new HashMap<>();
        response.put("code", 0);
        return response;
    }

    public static class AgentInstanceInfo {
        private String app;
        private String inst;
        private String ip;
        private String version;
        private String configVersion;
        private long lastHeartbeatTime;
        private boolean online;

        // Getters and setters
        public String getApp() { return app; }
        public void setApp(String app) { this.app = app; }
        public String getInst() { return inst; }
        public void setInst(String inst) { this.inst = inst; }
        public String getIp() { return ip; }
        public void setIp(String ip) { this.ip = ip; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public String getConfigVersion() { return configVersion; }
        public void setConfigVersion(String configVersion) { this.configVersion = configVersion; }
        public long getLastHeartbeatTime() { return lastHeartbeatTime; }
        public void setLastHeartbeatTime(long lastHeartbeatTime) { this.lastHeartbeatTime = lastHeartbeatTime; }
        public boolean isOnline() { return online; }
        public void setOnline(boolean online) { this.online = online; }
    }
}
