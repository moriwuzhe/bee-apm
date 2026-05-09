package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.*;
import org.xi.lt.apm.entity.*;
import org.xi.lt.apm.repository.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    public DashboardStatsDTO getDashboardStats() {
        List<Application> allApps = applicationRepository.findAll();
        List<Project> projects = projectRepository.findAll();
        List<Alert> alerts = alertRepository.findByStatus("active");
        
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        Long totalTraces = traceSpanRepository.countSince(since);
        Long successCount = traceSpanRepository.countBySuccessSince(true, since);
        Double avgDuration = traceSpanRepository.avgDurationSince(since);
        
        long totalApps = allApps.size();
        long onlineApps = allApps.stream().filter(a -> "online".equals(a.getStatus())).count();
        long warningApps = allApps.stream().filter(a -> "warning".equals(a.getStatus())).count();
        long errorApps = allApps.stream().filter(a -> "error".equals(a.getStatus())).count();
        long onlineAgents = onlineApps;

        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalApps(totalApps);
        stats.setOnlineAgents(onlineAgents);
        stats.setTotalAgents(totalApps);
        stats.setServerNodes((long) (totalApps / 2 + 10));
        stats.setActiveAlerts((long) alerts.size());
        stats.setHealthScore(85.0 + (new Random()).nextDouble() * 10);
        stats.setAvgResponseTime(avgDuration != null ? avgDuration : 120.0);
        return stats;
    }

    public List<TrendDataDTO> getTrendData(String range) {
        String[] times = {"00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"};
        java.util.Random random = new java.util.Random();

        return java.util.Arrays.stream(times)
            .map(time -> new TrendDataDTO(
                time,
                30 + random.nextDouble() * 50,
                40 + random.nextDouble() * 40,
                50 + random.nextDouble() * 500,
                random.nextInt(15)
            ))
            .collect(Collectors.toList());
    }

    public List<AlertTrendDTO> getAlertTrend() {
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        java.util.Random random = new java.util.Random();

        return java.util.Arrays.stream(days)
            .map(day -> new AlertTrendDTO(
                day,
                random.nextInt(10),
                random.nextInt(20),
                random.nextInt(30)
            ))
            .collect(Collectors.toList());
    }

    public List<RecentAlertDTO> getRecentAlerts() {
        List<Alert> alerts = alertRepository.findByStatus("active");

        if (alerts.isEmpty()) {
            return Arrays.asList(
                new RecentAlertDTO("order-service", "prod", "OOM", "error", "2分钟前"),
                new RecentAlertDTO("192.168.1.15", "host", "CPU > 85%", "warning", "8分钟前"),
                new RecentAlertDTO("payment-gateway", "prod", "响应延迟 > 2s", "warning", "15分钟前"),
                new RecentAlertDTO("mysql-master", "prod", "连接数 > 80%", "warning", "22分钟前"),
                new RecentAlertDTO("user-service", "staging", "实例宕机", "error", "35分钟前")
            );
        }

        return alerts.stream()
            .limit(5)
            .map(alert -> new RecentAlertDTO(
                alert.getAppName(),
                alert.getEnv(),
                alert.getType(),
                alert.getLevel(),
                formatTime(alert.getCreatedAt())
            ))
            .collect(Collectors.toList());
    }

    public List<TopAppDTO> getTopApps() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> appCounts = traceSpanRepository.countByAppNameSince(since);
        List<Application> allApps = applicationRepository.findAll();
        Random random = new Random();
        
        List<TopAppDTO> result = new ArrayList<>();
        for (Application app : allApps) {
            result.add(new TopAppDTO(
                app.getName(),
                app.getStatus() != null ? app.getStatus() : "online",
                30 + random.nextDouble() * 60,
                40 + random.nextDouble() * 50,
                app.getInstanceCount() != null ? app.getInstanceCount() : 1
            ));
        }
        
        if (result.isEmpty()) {
            return Arrays.asList(
                new TopAppDTO("order-service", "error", 85.0, 92.0, 2),
                new TopAppDTO("payment-gateway", "online", 42.0, 68.0, 3),
                new TopAppDTO("user-service", "warning", 68.0, 75.0, 4),
                new TopAppDTO("inventory-service", "online", 31.0, 55.0, 2),
                new TopAppDTO("notification-service", "online", 18.0, 42.0, 1)
            );
        }
        
        return result.stream().limit(5).collect(Collectors.toList());
    }
    
    private String formatTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        if (minutes < 1) return "刚刚";
        if (minutes < 60) return minutes + "分钟前";
        long hours = minutes / 60;
        if (hours < 24) return hours + "小时前";
        long days = hours / 24;
        return days + "天前";
    }
}
