package com.bistoury.controller;

import com.bistoury.entity.AgentInfo;
import com.bistoury.service.AgentService;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent管理控制器
 */
@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AgentController {

    @Resource
    private AgentService agentService;

    /**
     * 获取Agent列表
     */
    @GetMapping("/list")
    public List<AgentInfo> listAgents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return agentService.listAgents(status, keyword);
    }

    /**
     * 获取Agent详情
     */
    @GetMapping("/{agentId}")
    public AgentInfo getAgentDetail(@PathVariable String agentId) {
        return agentService.getAgentById(agentId);
    }

    /**
     * 获取Agent统计
     */
    @GetMapping("/stats")
    public Map<String, Long> getAgentStats() {
        Map<String, Long> stats = new HashMap<>();
        long total = agentService.getTotalCount();
        long running = agentService.getRunningCount();
        long warning = agentService.getWarningCount();
        long error = agentService.getErrorCount();
        
        stats.put("total", total);
        stats.put("running", running);
        stats.put("warning", warning);
        stats.put("error", error);
        return stats;
    }

    /**
     * 发送诊断命令到Agent
     */
    @PostMapping("/{agentId}/command")
    public String sendCommand(
            @PathVariable String agentId,
            @RequestBody Map<String, Object> command) {
        String cmd = (String) command.get("command");
        return agentService.sendCommand(agentId, cmd);
    }

    /**
     * 下线Agent
     */
    @PostMapping("/{agentId}/offline")
    public boolean offlineAgent(@PathVariable String agentId) {
        return agentService.offlineAgent(agentId);
    }
}
