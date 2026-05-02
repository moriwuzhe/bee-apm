package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.*;
import org.xi.lt.apm.entity.*;
import org.xi.lt.apm.repository.*;

import java.util.List;
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
    private MetricRepository metricRepository;

    public DashboardStatsDTO getDashboardStats() {
        long totalApps = applicationRepository.count();
        List<Application> allApps = applicationRepository.findAll();
        long onlineAgents = allApps.stream().filter(a -> "online".equals(a.getStatus())).count();
        List<Project> projects = projectRepository.findAll();
        List<Alert> alerts = alertRepository.findByStatus("active");

        return new DashboardStatsDTO(
            totalApps,
            onlineAgents,
            (long) allApps.size(),
            (long) projects.size(),
            (long) alerts.size(),
            87.3,
            142L
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
        List<Application> apps = applicationRepository.findAll().stream()
            .sorted((a, b) -> b.getHeapUsage().compareTo(a.getHeapUsage()))
            .limit(5)
            .collect(Collectors.toList());

        return apps.stream()
            .map(app -> new TopAppDTO(
                app.getName(),
                app.getStatus(),
                app.getHeapUsage(),
                app.getHeapUsage() * 0.8,
                app.getInstanceCount()
            ))
            .collect(Collectors.toList());
    }
}
