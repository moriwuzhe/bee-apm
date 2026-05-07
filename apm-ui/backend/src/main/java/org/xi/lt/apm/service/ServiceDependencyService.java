package org.xi.lt.apm.service;

import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.ServiceCallDTO;
import org.xi.lt.apm.dto.ServiceDependencyDTO;
import org.xi.lt.apm.dto.ServiceNodeDTO;

import java.util.Arrays;
import java.util.List;

@Service
public class ServiceDependencyService {

    public ServiceDependencyDTO getDependencyData() {
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