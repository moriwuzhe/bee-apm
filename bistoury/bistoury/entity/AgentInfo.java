package com.bistoury.entity;

import java.util.Date;

/**
 * Agent信息实体
 */
public class AgentInfo {
    /**
     * Agent唯一ID
     */
    private String agentId;
    
    /**
     * 应用名称
     */
    private String appName;
    
    /**
     * 应用版本
     */
    private String appVersion;
    
    /**
     * Agent版本
     */
    private String agentVersion;
    
    /**
     * 服务器IP地址
     */
    private String ip;
    
    /**
     * 服务器主机名
     */
    private String hostname;
    
    /**
     * 操作系统信息
     */
    private String osInfo;
    
    /**
     * JDK版本
     */
    private String jdkVersion;
    
    /**
     * JVM启动参数
     */
    private String jvmArgs;
    
    /**
     * 进程ID
     */
    private Integer pid;
    
    /**
     * 状态：online/offline/warning/error
     */
    private String status;
    
    /**
     * 注册时间
     */
    private Date registerTime;
    
    /**
     * 最后心跳时间
     */
    private Date lastHeartbeatTime;
    
    /**
     * 启动时间
     */
    private Date startTime;
    
    /**
     * 堆内存使用率
     */
    private Double heapUsage;
    
    /**
     * CPU使用率
     */
    private Double cpuUsage;
    
    /**
     * Full GC次数（最近1小时）
     */
    private Integer fullGcCount;
    
    /**
     * 是否有死锁
     */
    private Boolean hasDeadlock;
    
    /**
     * Netty通道
     */
    private transient io.netty.channel.Channel channel;
    
    /**
     * 状态常量
     */
    public static final String STATUS_ONLINE = "online";
    public static final String STATUS_OFFLINE = "offline";
    public static final String STATUS_WARNING = "warning";
    public static final String STATUS_ERROR = "error";

    // Getters and Setters
    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }

    public String getAgentVersion() {
        return agentVersion;
    }

    public void setAgentVersion(String agentVersion) {
        this.agentVersion = agentVersion;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getOsInfo() {
        return osInfo;
    }

    public void setOsInfo(String osInfo) {
        this.osInfo = osInfo;
    }

    public String getJdkVersion() {
        return jdkVersion;
    }

    public void setJdkVersion(String jdkVersion) {
        this.jdkVersion = jdkVersion;
    }

    public String getJvmArgs() {
        return jvmArgs;
    }

    public void setJvmArgs(String jvmArgs) {
        this.jvmArgs = jvmArgs;
    }

    public Integer getPid() {
        return pid;
    }

    public void setPid(Integer pid) {
        this.pid = pid;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getRegisterTime() {
        return registerTime;
    }

    public void setRegisterTime(Date registerTime) {
        this.registerTime = registerTime;
    }

    public Date getLastHeartbeatTime() {
        return lastHeartbeatTime;
    }

    public void setLastHeartbeatTime(Date lastHeartbeatTime) {
        this.lastHeartbeatTime = lastHeartbeatTime;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Double getHeapUsage() {
        return heapUsage;
    }

    public void setHeapUsage(Double heapUsage) {
        this.heapUsage = heapUsage;
    }

    public Double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(Double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public Integer getFullGcCount() {
        return fullGcCount;
    }

    public void setFullGcCount(Integer fullGcCount) {
        this.fullGcCount = fullGcCount;
    }

    public Boolean getHasDeadlock() {
        return hasDeadlock;
    }

    public void setHasDeadlock(Boolean hasDeadlock) {
        this.hasDeadlock = hasDeadlock;
    }

    public io.netty.channel.Channel getChannel() {
        return channel;
    }

    public void setChannel(io.netty.channel.Channel channel) {
        this.channel = channel;
    }
    
    // 兼容旧代码字段
    public void setHostIp(String hostIp) {
        this.ip = hostIp;
    }
    
    public void setClientIp(String clientIp) {
        this.ip = clientIp;
    }
}
