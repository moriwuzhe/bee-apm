package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.*;
import org.xi.lt.apm.service.DashboardService;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public Result<DashboardStatsDTO> getStats() {
        return Result.success(dashboardService.getDashboardStats());
    }

    @GetMapping("/trend")
    public Result<List<TrendDataDTO>> getTrend(@RequestParam(defaultValue = "24h") String range) {
        return Result.success(dashboardService.getTrendData(range));
    }

    @GetMapping("/alert-trend")
    public Result<List<AlertTrendDTO>> getAlertTrend() {
        return Result.success(dashboardService.getAlertTrend());
    }

    @GetMapping("/recent-alerts")
    public Result<List<RecentAlertDTO>> getRecentAlerts() {
        return Result.success(dashboardService.getRecentAlerts());
    }

    @GetMapping("/top-apps")
    public Result<List<TopAppDTO>> getTopApps() {
        return Result.success(dashboardService.getTopApps());
    }
}
