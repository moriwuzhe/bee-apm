package org.xi.lt.server.domain.model.span;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SpanView {
    private String id;
    private String gid;
    private String pid;
    private String type;
    private Long time;
    private String env;
    private String app;
    private String inst;
    private String ip;
    private String port;
    private Long spend;
    private Boolean error;
    private org.xi.lt.server.domain.model.span.tags.SpanTags tags;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGid() {
        return gid;
    }

    public void setGid(String gid) {
        this.gid = gid;
    }

    public String getPid() {
        return pid;
    }

    public void setPid(String pid) {
        this.pid = pid;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getTime() {
        return time;
    }

    public void setTime(Long time) {
        this.time = time;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

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

    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }

    public Long getSpend() {
        return spend;
    }

    public void setSpend(Long spend) {
        this.spend = spend;
    }

    public Boolean getError() {
        return error;
    }

    public void setError(Boolean error) {
        this.error = error;
    }

    public org.xi.lt.server.domain.model.span.tags.SpanTags getTags() {
        return tags;
    }

    public void setTags(org.xi.lt.server.domain.model.span.tags.SpanTags tags) {
        this.tags = tags;
    }
}
