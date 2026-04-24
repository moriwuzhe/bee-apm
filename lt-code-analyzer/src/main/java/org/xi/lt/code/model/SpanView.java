package org.xi.lt.code.model;

import lombok.Data;

import java.util.Map;

@Data
public class SpanView {
    private String traceId;
    private String spanId;
    private String parentSpanId;
    private String app;
    private String service;
    private String method;
    private Long startTime;
    private Long endTime;
    private Long duration;
    private Boolean isError;
    private Map<String, String> tags;
    private String type;
}
