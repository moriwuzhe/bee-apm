package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.service.JvmMonitorService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jvm")
@CrossOrigin(origins = "*")
public class JvmMonitorController {

    @Autowired
    private JvmMonitorService jvmMonitorService;

    @GetMapping("/applications")
    public Result<List<String>> getApplications() {
        return Result.success(jvmMonitorService.getApplications());
    }

    @GetMapping("/host-metrics")
    public Result<Map<String, Object>> getHostMetrics(@RequestParam(defaultValue = "order-service") String appName) {
        return Result.success(jvmMonitorService.getHostMetrics(appName));
    }

    @GetMapping("/heap-mem")
    public Result<List<Map<String, Object>>> getHeapMemData() {
        return Result.success(jvmMonitorService.getHeapMemData());
    }

    @GetMapping("/threads")
    public Result<List<Map<String, Object>>> getThreadData() {
        return Result.success(jvmMonitorService.getThreadData());
    }

    @GetMapping("/gc")
    public Result<List<Map<String, Object>>> getGcData() {
        return Result.success(jvmMonitorService.getGcData());
    }

    @GetMapping("/network")
    public Result<List<Map<String, Object>>> getNetworkData() {
        return Result.success(jvmMonitorService.getNetworkData());
    }

    @GetMapping("/class-loading")
    public Result<Map<String, Object>> getClassLoadingStats() {
        return Result.success(jvmMonitorService.getClassLoadingStats());
    }
}
