package org.xi.lt.apm.dto;

public class HealthCheckDTO {
    private String id;
    private String name;
    private String type;
    private String status;
    private int responseTime;
    private String lastChecked;
    private String version;
    private String host;

    public HealthCheckDTO() {}

    public HealthCheckDTO(String id, String name, String type, String status, int responseTime, String lastChecked, String version, String host) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.responseTime = responseTime;
        this.lastChecked = lastChecked;
        this.version = version;
        this.host = host;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getResponseTime() { return responseTime; }
    public void setResponseTime(int responseTime) { this.responseTime = responseTime; }
    public String getLastChecked() { return lastChecked; }
    public void setLastChecked(String lastChecked) { this.lastChecked = lastChecked; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
}