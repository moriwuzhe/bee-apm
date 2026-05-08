package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.ServiceCallDTO;
import org.xi.lt.apm.dto.ServiceDependencyDTO;
import org.xi.lt.apm.dto.ServiceNodeDTO;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.ApplicationRepository;
import org.xi.lt.apm.repository.TraceSpanRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ServiceDependencyService {

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    public ServiceDependencyDTO getDependencyData() {
        List<TraceSpan> spans = traceSpanRepository.findAll();
        
        if (spans.isEmpty()) {
            return getMockDependencyData();
        }

        Map<String, ServiceNodeDTO> serviceMap = new HashMap<>();
        Map<String, Map<String, long[]>> callMap = new HashMap<>();

        for (TraceSpan span : spans) {
            String appName = span.getAppName();
            if (appName == null || appName.isEmpty()) continue;

            serviceMap.computeIfAbsent(appName, k -> new ServiceNodeDTO(
                String.valueOf(serviceMap.size() + 1),
                appName,
                "app",
                "healthy",
                0, 0, 0
            ));

            ServiceNodeDTO node = serviceMap.get(appName);
            node.setCalls(node.getCalls() + 1);
            if (span.getDuration() != null) {
                node.setAvgResponseTime((int) ((node.getAvgResponseTime() * (node.getCalls() - 1) + span.getDuration()) / node.getCalls()));
            }
            if (!span.getSuccess()) {
                node.setErrorRate(node.getErrorRate() + 1.0 / node.getCalls());
            }

            if (span.getParentId() != null && !span.getParentId().isEmpty()) {
                Optional<TraceSpan> parentSpan = spans.stream()
                    .filter(s -> span.getParentId().equals(s.getId()))
                    .findFirst();
                
                if (parentSpan.isPresent()) {
                    String parentApp = parentSpan.get().getAppName();
                    if (parentApp != null && !parentApp.isEmpty() && !parentApp.equals(appName)) {
                        callMap.computeIfAbsent(parentApp, k -> new HashMap<>());
                        long[] stats = callMap.get(parentApp).computeIfAbsent(appName, k -> new long[]{0, 0});
                        stats[0]++;
                        if (span.getDuration() != null) {
                            stats[1] += span.getDuration();
                        }
                    }
                }
            }
        }

        List<ServiceNodeDTO> services = new ArrayList<>(serviceMap.values());
        List<ServiceCallDTO> calls = new ArrayList<>();

        for (Map.Entry<String, Map<String, long[]>> entry : callMap.entrySet()) {
            String source = entry.getKey();
            for (Map.Entry<String, long[]> callEntry : entry.getValue().entrySet()) {
                String target = callEntry.getKey();
                long[] stats = callEntry.getValue();
                calls.add(new ServiceCallDTO(source, target, (int) stats[0], (int) (stats[1] / stats[0])));
            }
        }

        if (services.isEmpty()) {
            return getMockDependencyData();
        }

        return new ServiceDependencyDTO(services, calls);
    }

    private ServiceDependencyDTO getMockDependencyData() {
        List<ServiceNodeDTO> services = Arrays.asList(
            new ServiceNodeDTO("1", "API Gateway", "gateway", "healthy", 12500, 45, 0.1),
            new ServiceNodeDTO("2", "User Service", "app", "healthy", 8900, 32, 0.2),
            new ServiceNodeDTO("3", "Order Service", "app", "warning", 5600, 120, 1.5),
            new ServiceNodeDTO("4", "Payment Service", "app", "healthy", 3200, 85, 0.3),
            new ServiceNodeDTO("5", "Inventory Service", "app", "healthy", 4100, 28, 0.1),
            new ServiceNodeDTO("6", "MySQL", "database", "healthy", 15000, 12, 0),
            new ServiceNodeDTO("7", "Redis", "cache", "healthy", 28000, 2, 0),
            new ServiceNodeDTO("8", "Kafka", "external", "warning", 5200, 15, 0.8)
        );

        List<ServiceCallDTO> calls = Arrays.asList(
            new ServiceCallDTO("API Gateway", "User Service", 4500, 25),
            new ServiceCallDTO("API Gateway", "Order Service", 3200, 38),
            new ServiceCallDTO("API Gateway", "Payment Service", 1800, 42),
            new ServiceCallDTO("User Service", "MySQL", 8900, 8),
            new ServiceCallDTO("User Service", "Redis", 12000, 1),
            new ServiceCallDTO("Order Service", "MySQL", 5600, 15),
            new ServiceCallDTO("Order Service", "Redis", 7800, 2),
            new ServiceCallDTO("Order Service", "Inventory Service", 2800, 18),
            new ServiceCallDTO("Order Service", "Kafka", 3500, 12),
            new ServiceCallDTO("Payment Service", "MySQL", 3200, 10),
            new ServiceCallDTO("Payment Service", "Kafka", 1700, 8),
            new ServiceCallDTO("Inventory Service", "MySQL", 4100, 12)
        );

        return new ServiceDependencyDTO(services, calls);
    }
}
