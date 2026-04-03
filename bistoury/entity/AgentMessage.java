package com.bistoury.entity;

import lombok.Data;

/**
 * Agent和Proxy之间的通信消息格式
 */
@Data
public class AgentMessage {
    /**
     * 魔数，固定为0x62697374 ("bist")
     */
    public static final int MAGIC_CODE = 0x62697374;

    /**
     * 消息类型
     */
    private int type;

    /**
     * 消息ID，用于请求响应匹配
     */
    private long requestId;

    /**
     * Agent ID，注册时返回，后续请求携带
     */
    private String agentId;

    /**
     * 应用名称
     */
    private String appName;

    /**
     * 主机IP
     */
    private String hostIp;

    /**
     * 进程ID
     */
    private int pid;

    /**
     * 消息体长度
     */
    private int bodyLength;

    /**
     * 消息体内容
     */
    private byte[] body;

    // 消息类型常量
    public static final int TYPE_REGISTER = 1;    // 注册请求
    public static final int TYPE_HEARTBEAT = 2;   // 心跳请求
    public static final int TYPE_COMMAND = 3;     // 命令请求
    public static final int TYPE_RESPONSE = 4;    // 响应消息
}
