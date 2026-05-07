package org.xi.lt.apm.dto;

public class TopologyEdgeDTO {
    private String from;
    private String to;
    private String latency;
    private boolean warn;
    private Integer qps;
    private String edgeType;
    private String topic;

    public TopologyEdgeDTO() {}

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getLatency() { return latency; }
    public void setLatency(String latency) { this.latency = latency; }
    public boolean isWarn() { return warn; }
    public void setWarn(boolean warn) { this.warn = warn; }
    public Integer getQps() { return qps; }
    public void setQps(Integer qps) { this.qps = qps; }
    public String getEdgeType() { return edgeType; }
    public void setEdgeType(String edgeType) { this.edgeType = edgeType; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
}