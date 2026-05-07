package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.service.ApplicationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/apm/agent")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AgentController {

    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public Result<List<Map<String, Object>>> getAllAgents() {
        try {
            List<Application> apps = applicationService.findAllActive();
            List<Map<String, Object>> agents = apps.stream().map(app -> {
                Map<String, Object> agent = new HashMap<>();
                agent.put("id", app.getId());
                agent.put("appName", app.getName());
                agent.put("ip", app.getIp());
                agent.put("hostname", app.getName());
                agent.put("status", app.getStatus());
                agent.put("agentVersion", app.getAgentVersion());
                agent.put("lastHb", app.getUpdatedAt() != null ? app.getUpdatedAt().toString() : "");
                agent.put("cpu", Math.random() * 80);
                agent.put("memory", Math.random() * 100);
                agent.put("disk", Math.random() * 100);
                agent.put("jvmVersion", "11.0.10");
                agent.put("heapUsage", app.getHeapUsage());
                agent.put("nonHeapUsage", Math.random() * 60);
                agent.put("threads", Math.random() * 200);
                agent.put("gcCount", Math.random() * 100);
                agent.put("gcTime", Math.random() * 500);
                return agent;
            }).collect(Collectors.toList());
            return Result.success(agents);
        } catch (Exception e) {
            logger.error("Failed to get agents", e);
            return Result.error("Failed to get agents");
        }
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getAgentById(@PathVariable Long id) {
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

    @PostMapping("/register")
    public Result<String> register(@RequestBody Map<String, Object> agentInfo) {
        try {
            String appName = (String) agentInfo.get("app");
            String env = (String) agentInfo.get("env");
            String inst = (String) agentInfo.get("inst");
            String ip = (String) agentInfo.get("ip");
            Integer port = agentInfo.get("port") instanceof Integer ? (Integer) agentInfo.get("port") : null;
            String agentVersion = (String) agentInfo.get("agentVersion");

            if (appName == null || appName.isEmpty()) {
                appName = "unknown-app";
            }

            Application app = applicationService.findByAppName(appName);
            if (app == null) {
                app = new Application();
                app.setName(appName);
                app.setStatus("online");
            }

            app.setEnv(env);
            app.setIp(ip);
            app.setPort(port);
            app.setAgentVersion(agentVersion);
            app.setUpdatedAt(LocalDateTime.now());
            app.setDeleted(false);

            applicationService.save(app);
            logger.info("Agent registered: app={}, env={}, inst={}, ip={}", appName, env, inst, ip);

            return Result.success("Agent registered successfully");
        } catch (Exception e) {
            logger.error("Agent registration failed", e);
            return Result.error("Registration failed: " + e.getMessage());
        }
    }

    @GetMapping("/heartbeat")
    public Result<String> heartbeat(@RequestParam(required = false) String app, @RequestParam(required = false) String ip) {
        try {
            if (app != null && !app.isEmpty()) {
                applicationService.updateHeartbeat(app, ip);
            }
            return Result.success("OK");
        } catch (Exception e) {
            logger.error("Heartbeat failed", e);
            return Result.error("Heartbeat failed");
        }
    }
}