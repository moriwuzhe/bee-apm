package org.xi.lt.apm.dto;

public class ServiceCallDTO {
    private String source;
    private String target;
    private int calls;
    private int avgTime;

    public ServiceCallDTO() {}

    public ServiceCallDTO(String source, String target, int calls, int avgTime) {
        this.source = source;
        this.target = target;
        this.calls = calls;
        this.avgTime = avgTime;
    }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public int getCalls() { return calls; }
    public void setCalls(int calls) { this.calls = calls; }
    public int getAvgTime() { return avgTime; }
    public void setAvgTime(int avgTime) { this.avgTime = avgTime; }
}