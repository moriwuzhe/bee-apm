package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.*;
import org.xi.lt.apm.entity.*;
import org.xi.lt.apm.repository.*;

import java.time.LocalDateTime;
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

        return new DashboardStatsDTO(
            totalApps,
            onlineApps,
            warningApps,
            errorApps,
            totalTraces != null ? totalTraces : 0L,
            successCount != null ? successCount : 0L,
            avgDuration != null ? avgDuration : 0.0,
            (long) alerts.size()
        );
    }

    public List<TrendDataDTO> getTrendData(String range) {
        String[] times = {"00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"};
        java.util.Random random = new java.util.Random();

        return java.util.Arrays.stream(times)
            .map(time -> new TrendDataDTO(
                time,
                30 + random.nextDouble() * 60,
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
                new RecentAlertDTO("order-service", "prod", "error", "error", LocalDateTime.now().toString()),
                new RecentAlertDTO("user-service", "prod", "warn", "warn", LocalDateTime.now().minusMinutes(10).toString()),
                new RecentAlertDTO("payment-gateway", "prod", "info", "info", LocalDateTime.now().minusMinutes(30).toString())
            );
        }

        return alerts.stream()
            .limit(5)
            .map(alert -> new RecentAlertDTO(
                alert.getAppName(),
                alert.getEnv(),
                alert.getType(),
                alert.getLevel(),
                alert.getCreatedAt() != null ? alert.getCreatedAt().toString() : ""
            ))
            .collect(Collectors.toList());
    }

    public List<TopAppDTO> getTopApps() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> appCounts = traceSpanRepository.countByAppNameSince(since);
        
        List<TopAppDTO> result = new ArrayList<>();
        for (Object[] row : appCounts) {
            String appName = (String) row[0];
            Long count = (Long) row[1];
            Double avgResponse = traceSpanRepository.avgDurationByAppNameSince(appName, since);
            
            result.add(new TopAppDTO(
                appName,
                "online",
                count != null ? count.doubleValue() : 0.0,
                avgResponse != null ? avgResponse : 0.0,
                1
            ));
        }
        
        if (result.isEmpty()) {
            return Arrays.asList(
                new TopAppDTO("order-service", "online", 123456.0, 125.0, 2),
                new TopAppDTO("payment-gateway", "online", 98765.0, 89.0, 3),
                new TopAppDTO("user-service", "online", 87654.0, 156.0, 2),
                new TopAppDTO("inventory-service", "online", 65432.0, 98.0, 1)
            );
        }
        
        return result.stream().limit(5).collect(Collectors.toList());
    }
}
