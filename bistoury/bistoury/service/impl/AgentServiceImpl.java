package com.bistoury.service.impl;

import com.bistoury.entity.AgentInfo;
import com.bistoury.entity.AgentMessage;
import com.bistoury.entity.DiagnoseCommand;
import com.bistoury.service.AgentService;
import com.bistoury.service.WebSocketService;
import io.netty.channel.Channel;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Agent 服务实现类（内存版本，快速演示）
 */
@Service
public class AgentServiceImpl implements AgentService {
    private final Map<String, AgentInfo> agentMap = new ConcurrentHashMap<>();
    private final Map<Channel, String> channelAgentMap = new ConcurrentHashMap<>();
    private final Map<String, DiagnoseCommand> commandResultMap = new ConcurrentHashMap<>();

    @Resource
    private WebSocketService webSocketService;

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
            agent.setStatus(i == 3 ? "warning" : i == 4 ? "error" : "online");
            agent.setStartTime(new Date(now.getTime() - i * 3600 * 1000));
            agent.setLastHeartbeatTime(new Date(now.getTime() - i * 60 * 1000));
            agent.setJvmArgs("-Xms2g -Xmx4g -XX:+UseG1GC");
            agent.setOsInfo("Linux 4.18.0-305.el8.x86_64");
            agent.setPid(10000 + i * 1000);
            agent.setHeapUsage(i == 3 ? 85.5 : 40.0 + i * 5);
            agent.setCpuUsage(i == 4 ? 92.3 : 20.0 + i * 3);
            agent.setFullGcCount(i == 3 ? 6 : 0);
            agent.setHasDeadlock(i == 4);
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
        long running = agentMap.values().stream().filter(a -> "online".equals(a.getStatus())).count();
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
        agentInfo.setStatus("online");
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
            agent.setStatus("online");
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
        return sendDiagnoseCommand(agentId, command);
    }

    @Override
    public String getCommandResult(String taskId) {
        DiagnoseCommand command = commandResultMap.get(taskId);
        return command != null ? command.getResult() : null;
    }

    @Override
    public void agentOffline(Channel channel) {
        String agentId = channelAgentMap.remove(channel);
        if (agentId != null) {
            AgentInfo agent = agentMap.get(agentId);
            if (agent != null) {
                agent.setStatus("offline");
            }
        }
    }

    @Override
    public String sendDiagnoseCommand(String agentId, String command) {
        AgentInfo agent = agentMap.get(agentId);
        if (agent == null || !"online".equals(agent.getStatus())) {
            throw new RuntimeException("Agent不在线或不存在");
        }
        
        // 生成任务ID
        String taskId = "task-" + System.currentTimeMillis();
        
        // 构造诊断命令
        DiagnoseCommand diagnoseCommand = new DiagnoseCommand();
        diagnoseCommand.setTaskId(taskId);
        diagnoseCommand.setAgentId(agentId);
        diagnoseCommand.setCommand(command);
        diagnoseCommand.setStatus("running");
        diagnoseCommand.setSubmitTime(new Date());
        
        // TODO: 真实环境下发送到Netty通道
        // 模拟命令执行，1秒后返回结果
        new Thread(() -> {
            try {
                Thread.sleep(1000);
                // 模拟Arthas命令返回结果
                String mockResult;
                if (command.startsWith("jvm")) {
                    mockResult = "=== JVM信息 ===\n版本: " + agent.getJdkVersion() + "\n堆内存: " + agent.getHeapUsage() + "%\nCPU使用率: " + agent.getCpuUsage() + "%\nFull GC次数: " + agent.getFullGcCount();
                } else if (command.startsWith("thread")) {
                    mockResult = "=== 线程信息 ===\n总线程数: 256\n活跃线程: 128\n死锁: " + (agent.getHasDeadlock() ? "检测到死锁" : "无死锁");
                } else if (command.startsWith("heapdump")) {
                    mockResult = "堆转储已生成，文件路径: /tmp/heapdump-" + agentId + ".hprof";
                } else {
                    mockResult = "命令执行成功:\n" + command + "\n执行时间: 100ms\n返回结果: \n[模拟返回数据，实际场景会返回真实Arthas执行结果]";
                }
                
                diagnoseCommand.setResult(mockResult);
                diagnoseCommand.setStatus("success");
                diagnoseCommand.setCostTime(1000L);
                commandResultMap.put(taskId, diagnoseCommand);
                
                // 推送结果到前端WebSocket
                webSocketService.pushCommandResult(taskId, diagnoseCommand.getResult());
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
        
        return taskId;
    }

    /**
     * 处理Agent返回的命令结果
     */
    @Override
    public void handleAgentResult(String agentId, DiagnoseCommand result) {
        commandResultMap.put(result.getTaskId(), result);
        // 推送到前端
        webSocketService.pushCommandResult(result.getTaskId(), result.getResult());
    }

    /**
     * 下线Agent
     */
    @Override
    public boolean offlineAgent(String agentId) {
        AgentInfo agent = agentMap.get(agentId);
        if (agent != null) {
            agent.setStatus("offline");
            return true;
        }
        return false;
    }

    @Override
    public long getTotalCount() {
        return agentMap.size();
    }

    @Override
    public long getRunningCount() {
        return agentMap.values().stream().filter(a -> "online".equals(a.getStatus())).count();
    }

    @Override
    public long getWarningCount() {
        return agentMap.values().stream().filter(a -> "warning".equals(a.getStatus())).count();
    }

    @Override
    public long getErrorCount() {
        return agentMap.values().stream().filter(a -> "error".equals(a.getStatus())).count();
    }

    @Override
    public List<AgentInfo> listAgents(String status, String keyword) {
        return agentMap.values().stream()
                .filter(a -> status == null || status.equals(a.getStatus()))
                .filter(a -> keyword == null || 
                        a.getAppName().contains(keyword) || 
                        a.getAgentId().contains(keyword) ||
                        a.getIp().contains(keyword))
                .sorted((a, b) -> b.getLastHeartbeatTime().compareTo(a.getLastHeartbeatTime()))
                .collect(Collectors.toList());
    }

    @Override
    public String sendCommand(String agentId, String command) {
        return sendDiagnoseCommand(agentId, command);
    }
}
