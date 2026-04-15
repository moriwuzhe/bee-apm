package org.xi.lt.server.web.application.agent;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.agent.AgentHeartbeatResult;
import org.xi.lt.server.domain.model.agent.AgentPullConfigResult;
import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;
import org.xi.lt.server.domain.repository.AgentInstanceRepository;
import org.xi.lt.server.domain.repository.AgentConfigRepository;
import org.xi.lt.server.domain.repository.ApplicationRepository;
import org.xi.lt.server.domain.repository.ProjectRepository;
import org.xi.lt.server.domain.model.config.Application;
import org.xi.lt.server.domain.model.config.Project;
import org.xi.lt.server.web.application.plugin.PluginRegistryService;
import org.xi.lt.server.web.interfaces.http.api.dto.AgentConfigUpdateRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AgentRegistryService {
    // 保留内存缓存用于快速访问
    private static final Map<String, Map<String, AgentInstanceInfo>> agentRegistry = new ConcurrentHashMap<>();
    private static final Map<String, String> appConfigVersions = new ConcurrentHashMap<>();
    private static final Map<String, String> appConfigs = new ConcurrentHashMap<>();

    @Autowired
    private AgentInstanceRepository agentInstanceRepository;

    @Autowired
    private AgentConfigRepository agentConfigRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PluginRegistryService pluginRegistryService;

    /**
     * 验证应用密钥或项目密钥
     * 
     * @param appCode 应用编码
     * @param secretKey 密钥（可以是应用密钥或项目密钥）
     * @return 是否验证通过
     */
    private boolean validateSecretKey(String appCode, String secretKey) {
        if (appCode == null || secretKey == null) {
            return false;
        }

        // 首先尝试用应用密钥验证
        Application application = applicationRepository.findByAppCode(appCode);
        if (application != null && secretKey.equals(application.getAppSecretKey())) {
            return true;
        }

        // 如果应用密钥验证失败，尝试用项目密钥验证
        if (application != null && application.getProjectCode() != null) {
            Project project = projectRepository.findByProjectCode(application.getProjectCode());
            if (project != null && secretKey.equals(project.getSecretKey())) {
                return true;
            }
        }

        return false;
    }

    /**
     * 根据应用编码获取项目编码
     * 
     * @param appCode 应用编码
     * @return 项目编码
     */
    private String getProjectCodeByAppCode(String appCode) {
        Application application = applicationRepository.findByAppCode(appCode);
        return application != null ? application.getProjectCode() : null;
    }

    /**
     * Agent注册接口
     */
    public void register(AgentInstanceInfo info) {
        // 验证密钥
        if (!validateSecretKey(info.getApp(), info.getSecretKey())) {
            throw new SecurityException("Invalid secret key");
        }
        
        // 自动设置 projectCode
        if (info.getProjectCode() == null) {
            info.setProjectCode(getProjectCodeByAppCode(info.getApp()));
        }
        
        info.setLastHeartbeatTime(System.currentTimeMillis());
        info.setOnline(true);
        
        // 保存到数据库
        AgentInstanceInfo existing = agentInstanceRepository.findByAppCodeAndInstId(info.getApp(), info.getInst());
        if (existing == null) {
            agentInstanceRepository.insert(info);
        } else {
            agentInstanceRepository.update(info);
        }
        
        // 更新内存缓存
        updateMemoryCache(info);
    }

    public AgentHeartbeatResult heartbeat(AgentInstanceInfo info) {
        // 验证密钥
        if (!validateSecretKey(info.getApp(), info.getSecretKey())) {
            throw new SecurityException("Invalid secret key");
        }
        
        // 自动设置 projectCode
        if (info.getProjectCode() == null) {
            info.setProjectCode(getProjectCodeByAppCode(info.getApp()));
        }
        
        info.setLastHeartbeatTime(System.currentTimeMillis());
        info.setOnline(true);
        
        // 保存到数据库
        AgentInstanceInfo existing = agentInstanceRepository.findByAppCodeAndInstId(info.getApp(), info.getInst());
        if (existing == null) {
            agentInstanceRepository.insert(info);
        } else {
            agentInstanceRepository.update(info);
        }
        
        // 更新内存缓存
        updateMemoryCache(info);

        AgentHeartbeatResult response = new AgentHeartbeatResult();

        // 从数据库获取最新配置版本
        String latestVersion = agentConfigRepository.findConfigVersionByAppCode(info.getApp());
        if (latestVersion == null) {
            latestVersion = "0";
        }
        
        if (!latestVersion.equals(info.getConfigVersion())) {
            response.setNewConfigVersion(latestVersion);
            response.setHasNewConfig(true);
        } else {
            response.setHasNewConfig(false);
        }
        
        // 检查插件更新
        // 这里简单处理，每次心跳都告诉Agent有新插件（实际生产中可以根据插件的最后更新时间来判断）
        response.setHasNewPlugins(true);
        response.setPluginLastUpdateTime(System.currentTimeMillis());
        
        return response;
    }

    public AgentPullConfigResult pullConfig(String app) {
        AgentPullConfigResult response = new AgentPullConfigResult();
        
        // 从数据库获取配置
        String config = agentConfigRepository.findConfigByAppCode(app);
        String version = agentConfigRepository.findConfigVersionByAppCode(app);
        
        if (config != null) {
            response.setConfig(config);
            response.setVersion(version);
            // 更新内存缓存
            appConfigs.put(app, config);
            appConfigVersions.put(app, version);
        } else {
            response.setConfig("");
            response.setVersion("0");
        }
        return response;
    }

    public List<AgentInstanceInfo> getInstances() {
        List<AgentInstanceInfo> allInstances = new ArrayList<>();
        long now = System.currentTimeMillis();

        // 从数据库获取所有实例
        List<AgentInstanceInfo> dbInstances = agentInstanceRepository.findAll();
        
        for (AgentInstanceInfo info : dbInstances) {
            info.setOnline(now - info.getLastHeartbeatTime() < 90000);
            allInstances.add(info);
            // 更新内存缓存
            updateMemoryCache(info);
        }

        return allInstances;
    }

    public void updateConfig(AgentConfigUpdateRequest payload) {
        String app = payload == null ? null : payload.getApp();
        String config = payload == null ? null : payload.getConfig();
        if (app != null && config != null) {
            String newVersion = UUID.randomUUID().toString();
            
            // 保存到数据库
            String existingVersion = agentConfigRepository.findConfigVersionByAppCode(app);
            if (existingVersion == null) {
                agentConfigRepository.insert(app, config, newVersion);
            } else {
                agentConfigRepository.update(app, config, newVersion);
            }
            
            // 更新内存缓存
            appConfigs.put(app, config);
            appConfigVersions.put(app, newVersion);
        }
    }
    
    private void updateMemoryCache(AgentInstanceInfo info) {
        agentRegistry.computeIfAbsent(info.getApp(), k -> new ConcurrentHashMap<>())
                    .put(info.getInst(), info);
    }
}
