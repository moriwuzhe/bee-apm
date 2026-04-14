package org.xi.lt.server.domain.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CallTreeNode {
    private String id;
    private String gid;
    private Long time;
    private String type;
    private String text;
    private String app;
    private Long spend;
    private List<CallTreeNode> children = new ArrayList<>();

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

    public Long getTime() {
        return time;
    }

    public void setTime(Long time) {
        this.time = time;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public Long getSpend() {
        return spend;
    }

    public void setSpend(Long spend) {
        this.spend = spend;
    }

    public List<CallTreeNode> getChildren() {
        return children;
    }

    public void setChildren(List<CallTreeNode> children) {
        this.children = children == null ? new ArrayList<>() : children;
    }
}
