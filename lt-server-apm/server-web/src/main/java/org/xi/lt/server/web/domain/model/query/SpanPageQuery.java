package org.xi.lt.server.web.domain.model.query;

import org.xi.lt.server.web.domain.model.SortDirection;

public class SpanPageQuery {
    private String type;
    private long beginMs;
    private long endMs;

    private String env;
    private String app;
    private String gid;
    private String ip;

    private String tagsRemoteLike;
    private String tagsUrlLike;
    private String tagsLogLike;

    private Long minSpend;
    private Long maxSpend;

    private String sortField;
    private SortDirection sortDirection;

    private int from;
    private int size;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getBeginMs() {
        return beginMs;
    }

    public void setBeginMs(long beginMs) {
        this.beginMs = beginMs;
    }

    public long getEndMs() {
        return endMs;
    }

    public void setEndMs(long endMs) {
        this.endMs = endMs;
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

    public String getGid() {
        return gid;
    }

    public void setGid(String gid) {
        this.gid = gid;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getTagsRemoteLike() {
        return tagsRemoteLike;
    }

    public void setTagsRemoteLike(String tagsRemoteLike) {
        this.tagsRemoteLike = tagsRemoteLike;
    }

    public String getTagsUrlLike() {
        return tagsUrlLike;
    }

    public void setTagsUrlLike(String tagsUrlLike) {
        this.tagsUrlLike = tagsUrlLike;
    }

    public String getTagsLogLike() {
        return tagsLogLike;
    }

    public void setTagsLogLike(String tagsLogLike) {
        this.tagsLogLike = tagsLogLike;
    }

    public Long getMinSpend() {
        return minSpend;
    }

    public void setMinSpend(Long minSpend) {
        this.minSpend = minSpend;
    }

    public Long getMaxSpend() {
        return maxSpend;
    }

    public void setMaxSpend(Long maxSpend) {
        this.maxSpend = maxSpend;
    }

    public String getSortField() {
        return sortField;
    }

    public void setSortField(String sortField) {
        this.sortField = sortField;
    }

    public SortDirection getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(SortDirection sortDirection) {
        this.sortDirection = sortDirection;
    }

    public int getFrom() {
        return from;
    }

    public void setFrom(int from) {
        this.from = from;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}
