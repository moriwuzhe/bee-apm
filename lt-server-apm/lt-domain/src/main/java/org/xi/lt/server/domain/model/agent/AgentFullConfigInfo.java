package org.xi.lt.server.domain.model.agent;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Agent完整配置信息（包含应用配置、实例配置和合并后的最终配置）
 * 
 * @author system
 * @date 2026/04/18
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentFullConfigInfo {
    /**
     * 应用编码
     */
    private String app;
    
    /**
     * 实例ID（可选）
     */
    private String inst;
    
    /**
     * 应用级配置
     */
    private String appConfig;
    
    /**
     * 应用级配置版本
     */
    private String appConfigVersion;
    
    /**
     * 实例级配置
     */
    private String instanceConfig;
    
    /**
     * 实例级配置版本
     */
    private String instanceConfigVersion;
    
    /**
     * 合并后的最终配置（实例配置覆盖应用配置）
     */
    private String mergedConfig;
    
    /**
     * 最终配置版本
     */
    private String finalVersion;

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public String getInst() {
        return inst;
    }

    public void setInst(String inst) {
        this.inst = inst;
    }

    public String getAppConfig() {
        return appConfig;
    }

    public void setAppConfig(String appConfig) {
        this.appConfig = appConfig;
    }

    public String getAppConfigVersion() {
        return appConfigVersion;
    }

    public void setAppConfigVersion(String appConfigVersion) {
        this.appConfigVersion = appConfigVersion;
    }

    public String getInstanceConfig() {
        return instanceConfig;
    }

    public void setInstanceConfig(String instanceConfig) {
        this.instanceConfig = instanceConfig;
    }

    public String getInstanceConfigVersion() {
        return instanceConfigVersion;
    }

    public void setInstanceConfigVersion(String instanceConfigVersion) {
        this.instanceConfigVersion = instanceConfigVersion;
    }

    public String getMergedConfig() {
        return mergedConfig;
    }

    public void setMergedConfig(String mergedConfig) {
        this.mergedConfig = mergedConfig;
    }

    public String getFinalVersion() {
        return finalVersion;
    }

    public void setFinalVersion(String finalVersion) {
        this.finalVersion = finalVersion;
    }
}
