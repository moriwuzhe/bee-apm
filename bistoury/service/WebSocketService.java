package com.bistoury.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import javax.annotation.Resource;

/**
 * WebSocket消息推送服务
 */
@Service
public class WebSocketService {

    @Resource
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 推送命令执行结果给前端
     * @param taskId 任务ID
     * @param result 执行结果
     */
    public void pushCommandResult(String taskId, String result) {
        messagingTemplate.convertAndSend("/topic/command/" + taskId, result);
    }

    /**
     * 推送Agent状态变更通知
     * @param agentId Agent ID
     * @param status 新状态
     */
    public void pushAgentStatusChange(String agentId, String status) {
        messagingTemplate.convertAndSend("/topic/agent/status/" + agentId, status);
    }

    /**
     * 广播全局通知
     * @param message 通知内容
     */
    public void broadcastNotification(String message) {
        messagingTemplate.convertAndSend("/topic/notification", message);
    }
}
