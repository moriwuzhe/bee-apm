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
        List<TraceSpan> spans = traceSpanRepository.findRecent(java.time.LocalDateTime.now().minusHours(24));
        
        if (spans == null || spans.isEmpty()) {
            // 如果没有真实数据，返回空数据，不使用mock
            return new ServiceDependencyDTO(new ArrayList<>(), new ArrayList<>());
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
            // 如果没有真实数据，返回空数据，不使用mock
            return new ServiceDependencyDTO(new ArrayList<>(), new ArrayList<>());
        }

        return new ServiceDependencyDTO(services, calls);
    }
}
