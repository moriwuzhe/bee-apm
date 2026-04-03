package com.bistoury.service;

import com.bistoury.entity.AgentInfo;
import com.bistoury.entity.DiagnoseCommand;
import io.netty.channel.Channel;

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
     * 分页查询Agent列表
     */
    List<AgentInfo> listAgents(String status, String keyword);

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
    void agentOffline(Channel channel);

    /**
     * 向Agent下发诊断命令
     * @param agentId 目标Agent ID
     * @param command 命令内容
     * @return 任务ID
     */
    String sendDiagnoseCommand(String agentId, String command);
    
    /**
     * 处理Agent返回的命令结果
     */
    void handleAgentResult(String agentId, DiagnoseCommand result);
    
    /**
     * 下线Agent
     */
    boolean offlineAgent(String agentId);
    
    /**
     * 获取Agent总数
     */
    long getTotalCount();

    /**
     * 获取运行中Agent数量
     */
    long getRunningCount();

    /**
     * 获取告警状态Agent数量
     */
    long getWarningCount();

    /**
     * 获取异常状态Agent数量
     */
    long getErrorCount();
    
    /**
     * 发送诊断命令（兼容接口）
     */
    String sendCommand(String agentId, String command);
}
