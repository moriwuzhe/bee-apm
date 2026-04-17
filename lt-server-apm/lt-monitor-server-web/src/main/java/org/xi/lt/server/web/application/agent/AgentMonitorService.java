package org.xi.lt.server.web.application.agent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.alert.AlertRow;
import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;
import org.xi.lt.server.domain.repository.UnifiedDataStore;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent 状态监控服务
 * 定期检查 Agent 在线状态，发现离线时触发告警
 */
@Service
public class AgentMonitorService {
    private static final Logger log = LoggerFactory.getLogger(AgentMonitorService.class);
    
    @Autowired
    private AgentRegistryService registryService;
    
    @Autowired
    private UnifiedDataStore dataStore;
    
    // 记录已告警的 Agent，避免重复告警
    private final Map<String, Long> alertedAgents = new ConcurrentHashMap<>();
    
    // 告警冷却时间（毫秒），默认 5 分钟
    private static final long ALERT_COOLDOWN_MS = 5 * 60 * 1000;
    
    /**
     * 定时检查 Agent 状态（每 30 秒执行一次）
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 60000)
    public void checkAgentStatus() {
        try {
            List<AgentInstanceInfo> instances = registryService.getInstances();
            long now = System.currentTimeMillis();
            
            for (AgentInstanceInfo instance : instances) {
                String agentKey = instance.getApp() + "@" + instance.getInst();
                boolean isOnline = instance.isOnline();
                
                if (!isOnline) {
                    // Agent 离线，检查是否需要告警
                    checkAndAlert(agentKey, instance, now);
                } else {
                    // Agent 在线，清除告警记录
                    if (alertedAgents.containsKey(agentKey)) {
                        log.info("Agent 恢复在线: {}", agentKey);
                        alertedAgents.remove(agentKey);
                        
                        // 记录恢复事件
                        recordRecoveryEvent(agentKey, instance);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to check agent status", e);
        }
    }
    
    /**
     * 检查并发送告警
     */
    private void checkAndAlert(String agentKey, 
                               AgentInstanceInfo instance, 
                               long now) {
        Long lastAlertTime = alertedAgents.get(agentKey);
        
        // 如果已经告警过，且在冷却期内，则跳过
        if (lastAlertTime != null && (now - lastAlertTime) < ALERT_COOLDOWN_MS) {
            return;
        }
        
        // 发送告警
        log.warn("Agent 离线告警: {} (IP: {}, Last Heartbeat: {})", 
                 agentKey, 
                 instance.getIp(),
                 instance.getLastHeartbeatTime());
        
        // 记录告警事件
        recordAlertEvent(agentKey, instance);
        
        // 更新告警时间
        alertedAgents.put(agentKey, now);
    }
    
    /**
     * 记录告警事件
     */
    private void recordAlertEvent(String agentKey, 
                                  AgentInstanceInfo instance) {
        try {
            AlertRow event = new AlertRow();
            event.setId(java.util.UUID.randomUUID().toString());
            event.setTime(System.currentTimeMillis());
            event.setApp(instance.getApp());
            event.setAlertType("AGENT_OFFLINE");
            event.setMessage(String.format("Agent [%s] 已离线 (IP: %s)，最后心跳时间: %s", 
                                          agentKey, 
                                          instance.getIp(),
                                          formatTimestamp(instance.getLastHeartbeatTime())));
            event.setStatus("ACTIVE");
            
            // 使用 save 方法保存告警
            dataStore.save(event);
            log.info("Alert event recorded: {}", agentKey);
        } catch (Exception e) {
            log.error("Failed to record alert event", e);
        }
    }
    
    /**
     * 记录恢复事件
     */
    private void recordRecoveryEvent(String agentKey,
                                     AgentInstanceInfo instance) {
        try {
            AlertRow event = new AlertRow();
            event.setId(java.util.UUID.randomUUID().toString());
            event.setTime(System.currentTimeMillis());
            event.setApp(instance.getApp());
            event.setAlertType("AGENT_RECOVERY");
            event.setMessage(String.format("Agent [%s] 已恢复在线 (IP: %s)", 
                                          agentKey,
                                          instance.getIp()));
            event.setStatus("RESOLVED");
            
            // 使用 save 方法保存告警
            dataStore.save(event);
            log.info("Recovery event recorded: {}", agentKey);
        } catch (Exception e) {
            log.error("Failed to record recovery event", e);
        }
    }
    
    /**
     * 格式化时间戳
     */
    private String formatTimestamp(long timestamp) {
        if (timestamp == 0) return "未知";
        return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date(timestamp));
    }
    
    /**
     * 获取已告警的 Agent 列表
     */
    public List<String> getAlertedAgents() {
        return new ArrayList<>(alertedAgents.keySet());
    }
    
    /**
     * 清除指定 Agent 的告警记录
     */
    public void clearAlert(String agentKey) {
        alertedAgents.remove(agentKey);
        log.info("Cleared alert for agent: {}", agentKey);
    }
}
