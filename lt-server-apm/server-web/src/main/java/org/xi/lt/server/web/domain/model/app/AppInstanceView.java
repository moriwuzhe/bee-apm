package org.xi.lt.server.web.domain.model.app;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AppInstanceView {
    private String app;
    private String inst;
    private String ip;
    private String env;
    private Long time;
    private org.xi.lt.server.web.domain.model.span.tags.HeartbeatTags tags;
    private Boolean online;

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

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public Long getTime() {
        return time;
    }

    public void setTime(Long time) {
        this.time = time;
    }

    public org.xi.lt.server.web.domain.model.span.tags.HeartbeatTags getTags() {
        return tags;
    }

    public void setTags(org.xi.lt.server.web.domain.model.span.tags.HeartbeatTags tags) {
        this.tags = tags;
    }

    public Boolean getOnline() {
        return online;
    }

    public void setOnline(Boolean online) {
        this.online = online;
    }
}
