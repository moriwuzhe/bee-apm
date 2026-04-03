package com.bistoury.service;

import com.bistoury.entity.AgentInfo;
import java.util.List;
import java.util.Map;

/**
 * Agent 管理服务
 */
public interface AgentService {
    /**
     * 获取所有Agent列表
     */
    List<AgentInfo> listAllAgents();

    /**
     * 获取Agent统计信息
     */
    Map<String, Integer> getAgentStats();

    /**
     * 根据ID获取Agent详情
     */
    AgentInfo getAgentById(String agentId);

    /**
     * Agent注册
     */
    boolean registerAgent(AgentInfo agentInfo);

    /**
     * Agent心跳上报
     */
    boolean heartbeat(String agentId);

    /**
     * 移除离线Agent
     */
    void removeOfflineAgents();

    /**
     * 执行诊断命令
     */
    String executeCommand(String agentId, String command);

    /**
     * 获取命令执行结果
     */
    String getCommandResult(String taskId);

    /**
     * Agent连接断开，处理离线
     */
    void agentOffline(io.netty.channel.Channel channel);

    /**
     * 向Agent下发诊断命令
     * @param agentId 目标Agent ID
     * @param command 命令内容
     * @return 任务ID
     */
    String sendDiagnoseCommand(String agentId, String command);
}