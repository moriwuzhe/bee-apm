package com.bistoury.controller;

import com.bistoury.entity.AgentInfo;
import com.bistoury.service.AgentService;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent 管理 API
 */
@RestController
@RequestMapping("/proxy/agent")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AgentController {
    @Resource
    private AgentService agentService;

    /**
     * 获取Agent统计信息
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("msg", "success");
        result.put("data", agentService.getAgentStats());
        return result;
    }

    /**
     * 获取Agent列表
     */
    @GetMapping("/list")
    public Map<String, Object> listAgents() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("msg", "success");
        result.put("data", agentService.listAllAgents());
        return result;
    }

    /**
     * 获取Agent详情
     */
    @GetMapping("/detail/{agentId}")
    public Map<String, Object> getAgentDetail(@PathVariable String agentId) {
        Map<String, Object> result = new HashMap<>();
        AgentInfo agent = agentService.getAgentById(agentId);
        if (agent != null) {
            result.put("code", 0);
            result.put("msg", "success");
            result.put("data", agent);
        } else {
            result.put("code", -1);
            result.put("msg", "Agent不存在");
        }
        return result;
    }

    /**
     * 执行诊断命令
     */
    @PostMapping("/{agentId}/execute")
    public Map<String, Object> executeCommand(
            @PathVariable String agentId,
            @RequestBody Map<String, String> params
    ) {
        String command = params.get("command");
        Map<String, Object> result = new HashMap<>();
        String taskId = "task-" + System.currentTimeMillis();
        // 异步执行命令
        String resultStr = agentService.executeCommand(agentId, command);
        result.put("code", 0);
        result.put("msg", "success");
        result.put("data", Map.of(
                "taskId", taskId,
                "result", resultStr
        ));
        return result;
    }

    /**
     * 获取命令执行结果
     */
    @GetMapping("/task/{taskId}/result")
    public Map<String, Object> getCommandResult(@PathVariable String taskId) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("msg", "success");
        result.put("data", agentService.getCommandResult(taskId));
        return result;
    }

    /**
     * 获取Agent版本概览
     */
    @GetMapping("/version/abstract")
    public Map<String, Object> getVersionAbstract() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("msg", "success");
        result.put("data", Map.of(
                "totalAgents", agentService.getAgentStats().get("total"),
                "latestVersion", "2.0.7",
                "oldestVersion", "2.0.0"
        ));
        return result;
    }
}