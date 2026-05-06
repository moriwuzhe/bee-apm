package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.service.ApplicationService;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/apm/agent")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class AgentController {

    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);

    @Autowired
    private ApplicationService applicationService;

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