package com.bistoury.service.impl;

import com.bistoury.entity.AgentInfo;
import com.bistoury.service.AgentService;
import io.netty.channel.Channel;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent 服务实现类（内存版本，快速演示）
 */
@Service
public class AgentServiceImpl implements AgentService {
    private final Map<String, AgentInfo> agentMap = new ConcurrentHashMap<>();
    private final Map<Channel, String> channelAgentMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void initMockData() {
        // 初始化模拟数据
        Date now = new Date();
        for (int i = 1; i <= 5; i++) {
            AgentInfo agent = new AgentInfo();
            agent.setAgentId("agent-" + i);
            agent.setAppName(i == 1 ? "订单服务" : i == 2 ? "支付服务" : i == 3 ? "用户服务" : i == 4 ? "商品服务" : "网关服务");
            agent.setIp("192.168.1.10" + i);
            agent.setHostname("app-server-" + i);
            agent.setJdkVersion(i % 2 == 0 ? "1.8.0_345" : "11.0.18");
            agent.setAppVersion("v" + i + ".0." + (i * 2));
            agent.setAgentVersion("2.0.7");
            agent.setStatus(i == 3 ? "warning" : i == 4 ? "error" : "running");
            agent.setStartTime(new Date(now.getTime() - i * 3600 * 1000));
            agent.setLastHeartbeatTime(new Date(now.getTime() - i * 60 * 1000));
            agent.setJvmArgs("-Xms2g -Xmx4g -XX:+UseG1GC");
            agent.setOsInfo("Linux 4.18.0-305.el8.x86_64");
            agentMap.put(agent.getAgentId(), agent);
        }
    }

    @Override
    public List<AgentInfo> listAllAgents() {
        return new ArrayList<>(agentMap.values());
    }

    @Override
    public Map<String, Integer> getAgentStats() {
        Map<String, Integer> stats = new HashMap<>();
        int total = agentMap.size();
        long running = agentMap.values().stream().filter(a -> "running".equals(a.getStatus())).count();
        long warning = agentMap.values().stream().filter(a -> "warning".equals(a.getStatus())).count();
        long error = agentMap.values().stream().filter(a -> "error".equals(a.getStatus())).count();
        
        stats.put("total", total);
        stats.put("running", (int) running);
        stats.put("warning", (int) warning);
        stats.put("error", (int) error);
        return stats;
    }

    @Override
    public AgentInfo getAgentById(String agentId) {
        return agentMap.get(agentId);
    }

    @Override
    public boolean registerAgent(AgentInfo agentInfo) {
        agentInfo.setLastHeartbeatTime(new Date());
        agentInfo.setStatus(AgentInfo.STATUS_ONLINE);
        agentInfo.setRegisterTime(new Date());
        agentMap.put(agentInfo.getAgentId(), agentInfo);
        // 保存channel和agentId的映射
        if (agentInfo.getChannel() != null) {
            channelAgentMap.put(agentInfo.getChannel(), agentInfo.getAgentId());
        }
        return true;
    }

    @Override
    public boolean heartbeat(String agentId) {
        AgentInfo agent = agentMap.get(agentId);
        if (agent != null) {
            agent.setLastHeartbeatTime(new Date());
            agent.setStatus("running");
            return true;
        }
        return false;
    }

    @Override
    public void removeOfflineAgents() {
        long now = System.currentTimeMillis();
        long timeout = 60 * 1000; // 60秒超时
        agentMap.entrySet().removeIf(entry -> 
            now - entry.getValue().getLastHeartbeatTime().getTime() > timeout
        );
    }

    @Override
    public String executeCommand(String agentId, String command) {
        // 模拟执行命令，后续对接真实Agent通信
        return "=== 命令 [" + command + "] 执行结果 ===\n" +
               "线程ID：123\n" +
               "执行时间：" + new Date() + "\n" +
               "返回结果：模拟执行成功，实际使用时对接真实Agent\n";
    }

    @Override
    public String getCommandResult(String taskId) {
        return "任务 " + taskId + " 执行完成";
    }

    @Override
    public void agentOffline(Channel channel) {
        String agentId = channelAgentMap.remove(channel);
        if (agentId != null) {
            AgentInfo agent = agentMap.get(agentId);
            if (agent != null) {
                agent.setStatus(AgentInfo.STATUS_OFFLINE);
            }
        }
    }
}