package org.xi.lt.apm.service;

import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.HealthCheckDTO;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class HealthCheckService {

    private final Random random = new Random();

    public List<HealthCheckDTO> getServiceStatus() {
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