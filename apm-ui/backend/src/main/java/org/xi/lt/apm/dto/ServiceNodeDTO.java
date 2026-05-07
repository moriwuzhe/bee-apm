package org.xi.lt.apm.dto;

public class ServiceNodeDTO {
    private String id;
    private String name;
    private String type;
    private String status;
    private int calls;
    private int avgResponseTime;
    private double errorRate;

    public ServiceNodeDTO() {}

    public ServiceNodeDTO(String id, String name, String type, String status, int calls, int avgResponseTime, double errorRate) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.calls = calls;
        this.avgResponseTime = avgResponseTime;
        this.errorRate = errorRate;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCalls() { return calls; }
    public void setCalls(int calls) { this.calls = calls; }
    public int getAvgResponseTime() { return avgResponseTime; }
    public void setAvgResponseTime(int avgResponseTime) { this.avgResponseTime = avgResponseTime; }
    public double getErrorRate() { return errorRate; }
    public void setErrorRate(double errorRate) { this.errorRate = errorRate; }
}