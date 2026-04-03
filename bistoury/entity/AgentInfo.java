package com.bistoury.entity;

import io.netty.channel.Channel;
import lombok.Data;
import java.util.Date;

/**
 * Agent 信息实体
 */
@Data
public class AgentInfo {
    public static final String STATUS_ONLINE = "online";
    public static final String STATUS_OFFLINE = "offline";
    public static final String STATUS_WARNING = "warning";
    public static final String STATUS_ERROR = "error";

    /**
     * Agent唯一ID
     */
    private String agentId;

    /**
     * 应用名称
     */
    private String appName;

    /**
     * IP地址
     */
    private String ip;

    /**
     * 主机IP
     */
    private String hostIp;

    /**
     * 进程ID
     */
    private Integer pid;

    /**
     * 客户端IP
     */
    private String clientIp;

    /**
     * 主机名
     */
    private String hostname;

    /**
     * JDK版本
     */
    private String jdkVersion;

    /**
     * 应用版本
     */
    private String appVersion;

    /**
     * Agent版本
     */
    private String agentVersion;

    /**
     * 状态：online/offline/warning/error
     */
    private String status;

    /**
     * 启动时间
     */
    private Date startTime;

    /**
     * 注册时间
     */
    private Date registerTime;

    /**
     * 最后心跳时间
     */
    private Date lastHeartbeatTime;

    /**
     * JVM参数
     */
    private String jvmArgs;

    /**
     * 系统信息
     */
    private String osInfo;

    /**
     * Netty连接通道
     */
    private transient Channel channel;
}
