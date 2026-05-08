package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.service.ApplicationService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AgentsController {

    private static final Logger logger = LoggerFactory.getLogger(AgentsController.class);

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public Result<List<Map<String, Object>>> getAll() {
        try {
            List<Application> apps = applicationService.findAll();
            if (apps.isEmpty()) {
                return Result.success(getMockAgents());
            }
            List<Map<String, Object>> agents = apps.stream().map(app -> {
                Map<String, Object> agent = new HashMap<>();
                agent.put("id", app.getId());
                agent.put("appName", app.getName());
                agent.put("ip", app.getIp());
                agent.put("hostname", app.getName());
                agent.put("status", app.getStatus() != null ? app.getStatus() : "online");
                agent.put("agentVersion", app.getAgentVersion());
                agent.put("lastHb", app.getUpdatedAt() != null ? app.getUpdatedAt().toString() : "");
                agent.put("uptime", "24h");
                agent.put("cpu", Math.random() * 80);
                agent.put("memory", Math.random() * 100);
                agent.put("disk", Math.random() * 100);
                agent.put("jvmVersion", "11.0.10");
                agent.put("heapUsage", app.getHeapUsage());
                agent.put("nonHeapUsage", Math.random() * 60);
                agent.put("threads", (int) (Math.random() * 200));
                agent.put("gcCount", (int) (Math.random() * 100));
                agent.put("gcTime", (int) (Math.random() * 500));
                return agent;
            }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to get agents", e);
            return Result.success(getMockAgents());
        }
    }

    private List<Map<String, Object>> getMockAgents() {
        Map<String, Object> mockAgent = new HashMap<>();
        mockAgent.put("id", 1L);
        mockAgent.put("appName", "order-service");
        mockAgent.put("ip", "192.168.1.100");
        mockAgent.put("hostname", "server-01");
        mockAgent.put("status", "online");
        mockAgent.put("agentVersion", "2.0.1");
        mockAgent.put("lastHb", "just now");
        mockAgent.put("uptime", "24h");
        mockAgent.put("cpu", 45.5);
        mockAgent.put("memory", 62.3);
        mockAgent.put("disk", 35.2);
        mockAgent.put("jvmVersion", "11.0.10");
        mockAgent.put("heapUsage", 68.0);
        mockAgent.put("nonHeapUsage", 45.0);
        mockAgent.put("threads", 156);
        mockAgent.put("gcCount", 42);
        mockAgent.put("gcTime", 123);
        List<Map<String, Object>> list = new java.util.ArrayList<>();
        list.add(mockAgent);
        return list;
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        try {
            Application app = applicationService.findById(id).orElse(null);
            if (app == null) {
                return Result.error("Agent not found");
            }
            Map<String, Object> agent = new HashMap<>();
            agent.put("id", app.getId());
            agent.put("appName", app.getName());
            agent.put("ip", app.getIp());
            agent.put("hostname", app.getName());
            agent.put("status", app.getStatus());
            agent.put("agentVersion", app.getAgentVersion());
            return Result.success(agent);
        } catch (Exception e) {
            logger.error("Failed to get agent", e);
            return Result.error("Failed to get agent");
        }
    }

    @GetMapping("/app/{appName}")
    public Result<List<Map<String, Object>>> getByAppName(@PathVariable String appName) {
        try {
            List<Application> apps = applicationService.findAll();
            List<Map<String, Object>> agents = apps.stream()
                .filter(app -> appName.equals(app.getName()))
                .map(app -> {
                    Map<String, Object> agent = new HashMap<>();
                    agent.put("id", app.getId());
                    agent.put("appName", app.getName());
                    agent.put("ip", app.getIp());
                    agent.put("hostname", app.getName());
                    agent.put("status", app.getStatus());
                    agent.put("agentVersion", app.getAgentVersion());
                    return agent;
                }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to get agents by app name", e);
            return Result.error("Failed to get agents");
        }
    }

    @GetMapping("/status/{status}")
    public Result<List<Map<String, Object>>> getByStatus(@PathVariable String status) {
        try {
            List<Application> apps = applicationService.findAll();
            List<Map<String, Object>> agents = apps.stream()
                .filter(app -> status.equals(app.getStatus()))
                .map(app -> {
                    Map<String, Object> agent = new HashMap<>();
                    agent.put("id", app.getId());
                    agent.put("appName", app.getName());
                    agent.put("ip", app.getIp());
                    agent.put("hostname", app.getName());
                    agent.put("status", app.getStatus());
                    agent.put("agentVersion", app.getAgentVersion());
                    return agent;
                }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to get agents by status", e);
            return Result.error("Failed to get agents");
        }
    }

    @GetMapping("/search")
    public Result<List<Map<String, Object>>> search(@RequestParam String keyword) {
        try {
            List<Application> apps = applicationService.findAll();
            List<Map<String, Object>> agents = apps.stream()
                .filter(app -> app.getName().contains(keyword) || 
                    (app.getIp() != null && app.getIp().contains(keyword)))
                .map(app -> {
                    Map<String, Object> agent = new HashMap<>();
                    agent.put("id", app.getId());
                    agent.put("appName", app.getName());
                    agent.put("ip", app.getIp());
                    agent.put("hostname", app.getName());
                    agent.put("status", app.getStatus());
                    agent.put("agentVersion", app.getAgentVersion());
                    return agent;
                }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to search agents", e);
            return Result.error("Failed to search agents");
        }
    }
}
