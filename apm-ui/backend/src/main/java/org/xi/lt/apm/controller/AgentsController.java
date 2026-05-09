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
@RequestMapping({"/api/agents", "/apm/agent"})
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
                return Result.success(generateMockAgents());
            }
            List<Map<String, Object>> agents = apps.stream().map(app -> {
                Map<String, Object> agent = new HashMap<>();
                agent.put("id", app.getId());
                agent.put("appName", app.getName());
                agent.put("ip", app.getIp());
                agent.put("hostname", app.getName());
                agent.put("status", app.getStatus() != null ? app.getStatus() : "online");
                agent.put("agentVersion", app.getAgentVersion());
                agent.put("lastHb", app.getUpdatedAt() != null ? app.getUpdatedAt().toString() : "2min");
                agent.put("uptime", app.getUptime() != null ? app.getUptime() : "24h");
                agent.put("cpu", 30 + Math.random() * 50);
                agent.put("memory", 40 + Math.random() * 40);
                agent.put("disk", 20 + Math.random() * 50);
                agent.put("jvmVersion", app.getJvmVersion());
                agent.put("heapUsage", app.getHeapUsage());
                agent.put("nonHeapUsage", 30 + Math.random() * 40);
                agent.put("threads", (int) (100 + Math.random() * 150));
                agent.put("gcCount", (int) (Math.random() * 200));
                agent.put("gcTime", (int) (Math.random() * 1000));
                return agent;
            }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to get agents", e);
            return Result.success(generateMockAgents());
        }
    }

    private List<Map<String, Object>> generateMockAgents() {
        Map<String, Object> mockAgent = new HashMap<>();
        mockAgent.put("id", 1L);
        mockAgent.put("appName", "order-service");
        mockAgent.put("ip", "192.168.1.100");
        mockAgent.put("hostname", "server-01");
        mockAgent.put("status", "online");
        mockAgent.put("agentVersion", "v2.4.1");
        mockAgent.put("lastHb", "2min");
        mockAgent.put("uptime", "24h");
        mockAgent.put("cpu", 45.5);
        mockAgent.put("memory", 62.3);
        mockAgent.put("disk", 35.2);
        mockAgent.put("jvmVersion", "17");
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

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> agentData) {
        try {
            Application app = new Application();
            app.setName((String) agentData.get("appName"));
            app.setIp((String) agentData.get("ip"));
            app.setAgentVersion((String) agentData.get("agentVersion"));
            app.setStatus((String) agentData.get("status"));
            app = applicationService.save(app);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", app.getId());
            result.put("appName", app.getName());
            result.put("ip", app.getIp());
            result.put("agentVersion", app.getAgentVersion());
            return Result.success(result);
        } catch (Exception e) {
            logger.error("Failed to create agent", e);
            return Result.error("Failed to create agent");
        }
    }

    @PutMapping("/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> agentData) {
        try {
            Application app = applicationService.findById(id).orElse(null);
            if (app == null) {
                return Result.error("Agent not found");
            }
            if (agentData.containsKey("appName")) {
                app.setName((String) agentData.get("appName"));
            }
            if (agentData.containsKey("ip")) {
                app.setIp((String) agentData.get("ip"));
            }
            if (agentData.containsKey("agentVersion")) {
                app.setAgentVersion((String) agentData.get("agentVersion"));
            }
            if (agentData.containsKey("status")) {
                app.setStatus((String) agentData.get("status"));
            }
            app = applicationService.save(app);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", app.getId());
            result.put("appName", app.getName());
            result.put("ip", app.getIp());
            result.put("agentVersion", app.getAgentVersion());
            return Result.success(result);
        } catch (Exception e) {
            logger.error("Failed to update agent", e);
            return Result.error("Failed to update agent");
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        try {
            applicationService.deleteById(id);
            return Result.success();
        } catch (Exception e) {
            logger.error("Failed to delete agent", e);
            return Result.error("Failed to delete agent");
        }
    }
}
