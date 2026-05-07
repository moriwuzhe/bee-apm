package org.xi.lt.apm.dto;

import java.util.List;

public class ServiceDependencyDTO {
    private List<ServiceNodeDTO> services;
    private List<ServiceCallDTO> calls;

    public ServiceDependencyDTO() {}

    public ServiceDependencyDTO(List<ServiceNodeDTO> services, List<ServiceCallDTO> calls) {
        this.services = services;
        this.calls = calls;
    }

    public List<ServiceNodeDTO> getServices() { return services; }
    public void setServices(List<ServiceNodeDTO> services) { this.services = services; }
    public List<ServiceCallDTO> getCalls() { return calls; }
    public void setCalls(List<ServiceCallDTO> calls) { this.calls = calls; }
}