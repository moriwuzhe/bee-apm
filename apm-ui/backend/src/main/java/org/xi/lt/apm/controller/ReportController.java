package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.repository.TraceSpanRepository;
import org.xi.lt.apm.repository.ApplicationRepository;
import org.xi.lt.apm.service.ApplicationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/apm/report")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/span")
    public Result<String> reportSpan(@RequestBody Map<String, Object> spanData) {
        try {
            TraceSpan span = new TraceSpan();
            span.setTraceId((String) spanData.get("traceId"));
            span.setSpanType((String) spanData.get("type"));
            span.setAppName((String) spanData.get("app"));
            span.setServiceName((String) spanData.get("serviceName"));
            span.setMethodName((String) spanData.get("methodName"));
            span.setParentId((String) spanData.get("parentId"));
            span.setIpAddress((String) spanData.get("ip"));
            span.setPort(spanData.get("port") != null ? ((Number) spanData.get("port")).intValue() : 0);
            span.setDuration(spanData.get("spend") != null ? ((Number) spanData.get("spend")).longValue() : 0);
            span.setSuccess(spanData.get("success") != null ? (Boolean) spanData.get("success") : true);
            span.setErrorMsg((String) spanData.get("errorMsg"));
            span.setInstanceName((String) spanData.get("inst"));
            span.setProcessId((String) spanData.get("pid"));
            span.setGroupId((String) spanData.get("gid"));
            span.setEnv((String) spanData.get("env"));
            
            Object tagsObj = spanData.get("tags");
            if (tagsObj instanceof Map) {
                span.setTags(((Map<?, ?>) tagsObj).toString());
            }
            
            span.setTimestamp(LocalDateTime.now());
            traceSpanRepository.save(span);
            
            updateApplicationStatus((String) spanData.get("app"), (String) spanData.get("ip"));
            
            logger.debug("Span reported: app={}, type={}, duration={}", span.getAppName(), span.getSpanType(), span.getDuration());
            return Result.success("Span reported successfully");
        } catch (Exception e) {
            logger.error("Failed to report span", e);
            return Result.error("Failed to report span: " + e.getMessage());
        }
    }

    @PostMapping("/spans")
    public Result<String> reportSpans(@RequestBody List<Map<String, Object>> spans) {
        try {
            for (Map<String, Object> spanData : spans) {
                TraceSpan span = new TraceSpan();
                span.setTraceId((String) spanData.get("traceId"));
                span.setSpanType((String) spanData.get("type"));
                span.setAppName((String) spanData.get("app"));
                span.setServiceName((String) spanData.get("serviceName"));
                span.setMethodName((String) spanData.get("methodName"));
                span.setParentId((String) spanData.get("parentId"));
                span.setIpAddress((String) spanData.get("ip"));
                span.setPort(spanData.get("port") != null ? ((Number) spanData.get("port")).intValue() : 0);
                span.setDuration(spanData.get("spend") != null ? ((Number) spanData.get("spend")).longValue() : 0);
                span.setSuccess(spanData.get("success") != null ? (Boolean) spanData.get("success") : true);
                span.setErrorMsg((String) spanData.get("errorMsg"));
                span.setInstanceName((String) spanData.get("inst"));
                span.setProcessId((String) spanData.get("pid"));
                span.setGroupId((String) spanData.get("gid"));
                span.setEnv((String) spanData.get("env"));
                
                Object tagsObj = spanData.get("tags");
                if (tagsObj instanceof Map) {
                    span.setTags(((Map<?, ?>) tagsObj).toString());
                }
                
                span.setTimestamp(LocalDateTime.now());
                traceSpanRepository.save(span);
                
                updateApplicationStatus((String) spanData.get("app"), (String) spanData.get("ip"));
            }
            logger.info("Batch reported {} spans", spans.size());
            return Result.success("Spans reported successfully");
        } catch (Exception e) {
            logger.error("Failed to batch report spans", e);
            return Result.error("Failed to report spans: " + e.getMessage());
        }
    }

    @PostMapping("/heartbeat")
    public Result<String> heartbeat(@RequestBody Map<String, Object> data) {
        try {
            String app = (String) data.get("app");
            String ip = (String) data.get("ip");
            String inst = (String) data.get("inst");
            String agentVersion = (String) data.get("agentVersion");
            
            applicationService.updateHeartbeat(app, ip);
            
            logger.debug("Heartbeat received: app={}, ip={}, inst={}", app, ip, inst);
            return Result.success("Heartbeat received");
        } catch (Exception e) {
            logger.error("Failed to process heartbeat", e);
            return Result.error("Failed to process heartbeat");
        }
    }

    @PostMapping("/register")
    public Result<String> register(@RequestBody Map<String, Object> data) {
        try {
            String appName = (String) data.get("app");
            String env = (String) data.get("env");
            String inst = (String) data.get("inst");
            String ip = (String) data.get("ip");
            Integer port = data.get("port") instanceof Integer ? (Integer) data.get("port") : null;
            String agentVersion = (String) data.get("agentVersion");

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

    private void updateApplicationStatus(String appName, String ip) {
        if (appName == null) return;
        Application app = applicationService.findByAppName(appName);
        if (app != null) {
            app.setStatus("online");
            if (ip != null) {
                app.setIp(ip);
            }
            applicationService.save(app);
        }
    }
}
