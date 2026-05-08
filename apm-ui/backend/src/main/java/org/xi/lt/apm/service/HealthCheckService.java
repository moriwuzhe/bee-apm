package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.HealthCheckDTO;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.ApplicationRepository;
import org.xi.lt.apm.repository.TraceSpanRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class HealthCheckService {

    private final Random random = new Random();

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    public List<HealthCheckDTO> getServiceStatus() {
        List<HealthCheckDTO> statusList = new ArrayList<>();
        
        List<Application> apps = applicationRepository.findAll();
        if (!apps.isEmpty()) {
            int id = 1;
            for (Application app : apps) {
                String status = determineStatus(app);
                String lastHeartbeat = formatLastHeartbeat(app.getUpdatedAt());
                
                statusList.add(new HealthCheckDTO(
                    String.valueOf(id++),
                    app.getName(),
                    "agent",
                    status,
                    random.nextInt(50),
                    lastHeartbeat,
                    app.getAgentVersion() != null ? app.getAgentVersion() : "v1.0.0",
                    app.getIp() != null ? app.getIp() : "unknown"
                ));
            }
        }

        if (statusList.isEmpty()) {
            return getMockStatus();
        }

        statusList.addAll(getSystemServicesStatus());
        
        return statusList;
    }

    private String determineStatus(Application app) {
        if ("offline".equalsIgnoreCase(app.getStatus())) {
            return "offline";
        }
        
        if (app.getUpdatedAt() == null) {
            return "offline";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutesSinceUpdate = ChronoUnit.MINUTES.between(app.getUpdatedAt(), now);
        
        if (minutesSinceUpdate > 5) {
            return "warning";
        }
        
        return "online";
    }

    private String formatLastHeartbeat(LocalDateTime updatedAt) {
        if (updatedAt == null) {
            return "从未";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long seconds = ChronoUnit.SECONDS.between(updatedAt, now);
        
        if (seconds < 60) {
            return seconds == 0 ? "刚刚" : seconds + "秒前";
        }
        
        long minutes = ChronoUnit.MINUTES.between(updatedAt, now);
        if (minutes < 60) {
            return minutes + "分钟前";
        }
        
        long hours = ChronoUnit.HOURS.between(updatedAt, now);
        return hours + "小时前";
    }

    private List<HealthCheckDTO> getSystemServicesStatus() {
        return Arrays.asList(
            new HealthCheckDTO(String.valueOf(100 + random.nextInt(10)), "APM Backend", "backend", "online", 10 + random.nextInt(20), "刚刚", "v2.4.1", "localhost:8081"),
            new HealthCheckDTO(String.valueOf(100 + random.nextInt(10)), "H2 Database", "database", "online", 5 + random.nextInt(15), "刚刚", "1.4.200", "localhost:8081/h2-console"),
            new HealthCheckDTO(String.valueOf(100 + random.nextInt(10)), "Agent Collector", "backend", "online", 1 + random.nextInt(5), "刚刚", "v1.0.0", "localhost:8081/apm/report")
        );
    }

    private List<HealthCheckDTO> getMockStatus() {
        return Arrays.asList(
            new HealthCheckDTO("1", "APM Backend", "backend", "online", 10 + random.nextInt(20), "刚刚", "v2.4.1", "localhost:8081"),
            new HealthCheckDTO("2", "MySQL Database", "database", "online", 5 + random.nextInt(15), "刚刚", "8.0.33", "localhost:3306"),
            new HealthCheckDTO("3", "Redis Cache", "redis", "online", 1 + random.nextInt(5), "刚刚", "7.0.11", "localhost:6379"),
            new HealthCheckDTO("4", "Agent Service", "agent", "online", 12 + random.nextInt(15), "刚刚", "v1.2.0", "localhost:9999"),
            new HealthCheckDTO("5", "Prometheus", "backend", "warning", 140 + random.nextInt(40), "5秒前", "v2.45.0", "localhost:9090"),
            new HealthCheckDTO("6", "Grafana", "backend", "offline", 0, "1分钟前", "v10.1.0", "localhost:3000")
        );
    }
}
