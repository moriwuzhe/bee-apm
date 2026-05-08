package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.service.TraceSpanService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/apm")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class TraceSpanController {

    private static final Logger logger = LoggerFactory.getLogger(TraceSpanController.class);

    @Autowired
    private TraceSpanService traceSpanService;

    // ReportController已接管此功能，避免URL映射冲突

    @GetMapping("/traces")
    public Result<List<TraceSpan>> getTraces(
            @RequestParam(defaultValue = "24") Integer hours,
            @RequestParam(required = false) String appName,
            @RequestParam(required = false) String spanType) {
        try {
            List<TraceSpan> spans;
            if (appName != null && spanType != null) {
                LocalDateTime end = LocalDateTime.now();
                LocalDateTime start = end.minusHours(hours);
                spans = traceSpanService.findByAppNameAndTimeRange(appName, start, end);
                spans = spans.stream().filter(s -> s.getSpanType() != null && s.getSpanType().equals(spanType)).collect(Collectors.toList());
            } else if (appName != null) {
                LocalDateTime end = LocalDateTime.now();
                LocalDateTime start = end.minusHours(hours);
                spans = traceSpanService.findByAppNameAndTimeRange(appName, start, end);
            } else {
                spans = traceSpanService.findRecent(hours);
            }
            return Result.success(spans);
        } catch (Exception e) {
            logger.error("Failed to get traces", e);
            return Result.error("Failed to get traces: " + e.getMessage());
        }
    }

    @GetMapping("/trace/{traceId}")
    public Result<List<TraceSpan>> getTraceById(@PathVariable String traceId) {
        try {
            List<TraceSpan> spans = traceSpanService.findByTraceId(traceId);
            return Result.success(spans);
        } catch (Exception e) {
            logger.error("Failed to get trace by ID: " + traceId, e);
            return Result.error("Failed to get trace: " + e.getMessage());
        }
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats(@RequestParam(defaultValue = "24") Integer hours) {
        try {
            Map<String, Object> stats = traceSpanService.getGlobalStats(hours);
            return Result.success(stats);
        } catch (Exception e) {
            logger.error("Failed to get global stats", e);
            return Result.error("Failed to get stats: " + e.getMessage());
        }
    }

    @GetMapping("/app/{appName}/spans")
    public Result<List<TraceSpan>> getSpansByApp(@PathVariable String appName) {
        try {
            List<TraceSpan> spans = traceSpanService.findByAppName(appName);
            return Result.success(spans);
        } catch (Exception e) {
            logger.error("Failed to get spans for app: " + appName, e);
            return Result.error("Failed to get spans: " + e.getMessage());
        }
    }

    @GetMapping("/app/{appName}/spans/recent")
    public Result<List<TraceSpan>> getRecentSpansByApp(
            @PathVariable String appName,
            @RequestParam(defaultValue = "24") Integer hours) {
        try {
            LocalDateTime end = LocalDateTime.now();
            LocalDateTime start = end.minusHours(hours);
            List<TraceSpan> spans = traceSpanService.findByAppNameAndTimeRange(appName, start, end);
            return Result.success(spans);
        } catch (Exception e) {
            logger.error("Failed to get recent spans for app: " + appName, e);
            return Result.error("Failed to get recent spans: " + e.getMessage());
        }
    }

    @GetMapping("/app/{appName}/stats")
    public Result<Map<String, Object>> getAppStats(
            @PathVariable String appName,
            @RequestParam(defaultValue = "24") Integer hours) {
        try {
            LocalDateTime since = LocalDateTime.now().minusHours(hours);
            Map<String, Object> stats = traceSpanService.getTraceStats(appName, since);
            return Result.success(stats);
        } catch (Exception e) {
            logger.error("Failed to get stats for app: " + appName, e);
            return Result.error("Failed to get stats: " + e.getMessage());
        }
    }

    @GetMapping("/app-names")
    public Result<List<String>> getAppNames(@RequestParam(defaultValue = "24") Integer hours) {
        try {
            List<String> appNames = traceSpanService.findAllAppNames(hours);
            return Result.success(appNames);
        } catch (Exception e) {
            logger.error("Failed to get app names", e);
            return Result.error("Failed to get app names: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public Result<String> health() {
        return Result.success("OK");
    }

    @DeleteMapping("/clear")
    public Result<String> clearAllData() {
        try {
            traceSpanService.deleteAll();
            return Result.success("All data cleared successfully");
        } catch (Exception e) {
            logger.error("Failed to clear data", e);
            return Result.error("Failed to clear data: " + e.getMessage());
        }
    }
}
