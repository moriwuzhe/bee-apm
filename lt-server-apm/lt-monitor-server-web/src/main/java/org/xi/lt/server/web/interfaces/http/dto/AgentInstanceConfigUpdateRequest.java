package org.xi.lt.server.web.interfaces.http.dto;

/**
 * Agent实例配置更新请求
 * 
 * @author system
 * @date 2026/04/16
 */
public class AgentInstanceConfigUpdateRequest {
    private String app;
    private String inst;
    private String config;

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

    public String getConfig() {
        return config;
    }

    public void setConfig(String config) {
        this.config = config;
    }
}
