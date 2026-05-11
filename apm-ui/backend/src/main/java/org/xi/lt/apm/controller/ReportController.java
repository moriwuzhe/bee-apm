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
import org.xi.lt.apm.service.TraceSpanService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/apm/report")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    @Autowired
    private TraceSpanService traceSpanService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationService applicationService;

    /**
     * 接收Agent上报的单个Span
     */
    @PostMapping("/span")
    public Result<String> reportSpan(@RequestBody Map<String, Object> spanData) {
        try {
            TraceSpan span = convertToTraceSpan(spanData);
            if (span != null) {
                traceSpanRepository.save(span);
                updateApplicationStatus(span.getAppName(), span.getIpAddress());
                logger.debug("Span reported: app={}, type={}, duration={}", span.getAppName(), span.getSpanType(), span.getDuration());
            }
            return Result.success("Span reported successfully");
        } catch (Exception e) {
            logger.error("Failed to report span", e);
            return Result.error("Failed to report span: " + e.getMessage());
        }
    }

    /**
     * 接收Agent上报的批量Span（Agent主要使用这个接口）
     */
    @PostMapping
    public Result<String> reportSpans(@RequestBody List<Map<String, Object>> spans) {
        try {
            if (spans == null || spans.isEmpty()) {
                return Result.success("No spans to report");
            }

            traceSpanService.report(spans);

            return Result.success("Spans reported successfully");
        } catch (Exception e) {
            logger.error("Failed to batch report spans", e);
            return Result.error("Failed to report spans: " + e.getMessage());
        }
    }

    /**
     * 接收Agent上报的批量Span（备用路径）
     */
    @PostMapping("/spans")
    public Result<String> reportSpansBackup(@RequestBody List<Map<String, Object>> spans) {
        return reportSpans(spans);
    }

    /**
     * 处理Agent心跳
     */
    @PostMapping("/heartbeat")
    public Result<String> heartbeat(@RequestBody Map<String, Object> data) {
        try {
            String app = (String) data.get("app");
            String ip = (String) data.get("ip");
            String inst = (String) data.get("inst");
            
            if (app != null && !app.isEmpty()) {
                applicationService.updateHeartbeat(app, ip);
                logger.debug("Heartbeat received: app={}, ip={}, inst={}", app, ip, inst);
            }
            
            return Result.success("Heartbeat received");
        } catch (Exception e) {
            logger.error("Failed to process heartbeat", e);
            return Result.error("Failed to process heartbeat");
        }
    }

    /**
     * 处理Agent注册
     */
    @PostMapping("/register")
    public Result<String> register(@RequestBody Map<String, Object> data) {
        try {
            String appName = (String) data.get("app");
            String env = (String) data.get("env");
            String inst = (String) data.get("inst");
            String ip = (String) data.get("ip");
            String agentVersion = (String) data.get("agentVersion");
            
            Object portObj = data.get("port");
            Integer port = null;
            if (portObj != null) {
                if (portObj instanceof Number) {
                    port = ((Number) portObj).intValue();
                } else if (portObj instanceof String) {
                    try {
                        port = Integer.parseInt((String) portObj);
                    } catch (NumberFormatException ignored) {}
                }
            }

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

    /**
     * 将Agent的Span数据转换为TraceSpan实体
     */
    private TraceSpan convertToTraceSpan(Map<String, Object> spanData) {
        try {
            logger.debug("Processing span data: {}", spanData);
            
            if (spanData == null || spanData.isEmpty()) {
                logger.warn("Empty span data received");
                return null;
            }

            TraceSpan span = new TraceSpan();
            
            // 提取基本字段 - 安全转换
            Object idObj = spanData.get("id");
            span.setTraceId(idObj != null ? String.valueOf(idObj) : null);
            
            Object typeObj = spanData.get("type");
            span.setSpanType(typeObj != null ? String.valueOf(typeObj) : null);
            
            Object appObj = spanData.get("app");
            span.setAppName(appObj != null ? String.valueOf(appObj) : null);
            
            Object envObj = spanData.get("env");
            span.setEnv(envObj != null ? String.valueOf(envObj) : null);
            
            Object instObj = spanData.get("inst");
            span.setInstanceName(instObj != null ? String.valueOf(instObj) : null);
            
            Object ipObj = spanData.get("ip");
            span.setIpAddress(ipObj != null ? String.valueOf(ipObj) : null);
            
            Object pidObj = spanData.get("pid");
            span.setProcessId(pidObj != null ? String.valueOf(pidObj) : null);
            
            Object gidObj = spanData.get("gid");
            span.setGroupId(gidObj != null ? String.valueOf(gidObj) : null);
            
            // 处理端口
            Object portObj = spanData.get("port");
            if (portObj != null) {
                if (portObj instanceof Number) {
                    span.setPort(((Number) portObj).intValue());
                } else if (portObj instanceof String) {
                    try {
                        span.setPort(Integer.parseInt((String) portObj));
                    } catch (NumberFormatException ignored) {}
                }
            }
            
            // 处理耗时
            Object spendObj = spanData.get("spend");
            if (spendObj != null) {
                if (spendObj instanceof Number) {
                    span.setDuration(((Number) spendObj).longValue());
                } else if (spendObj instanceof String) {
                    try {
                        span.setDuration(Long.parseLong((String) spendObj));
                    } catch (NumberFormatException ignored) {}
                }
            }
            
            // 处理时间戳
            Object timeObj = spanData.get("time");
            if (timeObj != null) {
                if (timeObj instanceof Number) {
                    long timestamp = ((Number) timeObj).longValue();
                    span.setTimestamp(LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(timestamp),
                        ZoneId.systemDefault()
                    ));
                }
            }
            if (span.getTimestamp() == null) {
                span.setTimestamp(LocalDateTime.now());
            }
            
            // 从tags中提取更多信息
            Object tagsObj = spanData.get("tags");
            if (tagsObj instanceof Map) {
                Map<?, ?> tags = (Map<?, ?>) tagsObj;
                
                Object serviceNameObj = tags.get("serviceName");
                span.setServiceName(serviceNameObj != null ? String.valueOf(serviceNameObj) : null);
                
                Object methodNameObj = tags.get("methodName");
                span.setMethodName(methodNameObj != null ? String.valueOf(methodNameObj) : null);
                
                Object parentIdObj = tags.get("parentId");
                span.setParentId(parentIdObj != null ? String.valueOf(parentIdObj) : null);
                
                // 处理成功状态
                Object successObj = tags.get("success");
                if (successObj != null) {
                    if (successObj instanceof Boolean) {
                        span.setSuccess((Boolean) successObj);
                    } else if (successObj instanceof String) {
                        span.setSuccess(Boolean.parseBoolean((String) successObj));
                    }
                }
                
                // 处理错误信息
                Object errorMsgObj = tags.get("errorMsg");
                span.setErrorMsg(errorMsgObj != null ? String.valueOf(errorMsgObj) : null);
                
                // 保存完整tags
                try {
                    span.setTags(tags.toString());
                } catch (Exception e) {
                    logger.warn("Failed to convert tags to string", e);
                    span.setTags("{}");
                }
            }
            
            // 如果tags中没有提取到信息，尝试从顶层提取
            if (span.getServiceName() == null) {
                Object serviceNameObj = spanData.get("serviceName");
                span.setServiceName(serviceNameObj != null ? String.valueOf(serviceNameObj) : null);
            }
            if (span.getMethodName() == null) {
                Object methodNameObj = spanData.get("methodName");
                span.setMethodName(methodNameObj != null ? String.valueOf(methodNameObj) : null);
            }
            if (span.getParentId() == null) {
                Object parentIdObj = spanData.get("parentId");
                span.setParentId(parentIdObj != null ? String.valueOf(parentIdObj) : null);
            }
            
            // 设置默认值
            if (span.getSuccess() == null) {
                span.setSuccess(true);
            }
            
            logger.debug("Successfully converted span: traceId={}, appName={}", span.getTraceId(), span.getAppName());
            return span;
        } catch (Exception e) {
            logger.error("Failed to convert span data: {}", spanData, e);
            return null;
        }
    }

    /**
     * 更新应用状态
     */
    private void updateApplicationStatus(String appName, String ip) {
        if (appName == null || appName.isEmpty()) {
            return;
        }
        
        try {
            Application app = applicationService.findByAppName(appName);
            if (app == null) {
                app = new Application();
                app.setName(appName);
                app.setStatus("online");
            }
            
            if (ip != null && !ip.isEmpty()) {
                app.setIp(ip);
            }
            
            app.setUpdatedAt(LocalDateTime.now());
            applicationService.save(app);
        } catch (Exception e) {
            logger.warn("Failed to update application status for app: " + appName, e);
        }
    }
}
