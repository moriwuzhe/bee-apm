package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class AlertRuleDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String metric;
    private String condition;
    private Double threshold;
    private String unit;
    private String level;
    private String status;
    private List<String> channels;
    private Integer triggerCount;
    private String lastTrigger;
    private String appName;

    public AlertRuleDTO() {}

    public AlertRuleDTO(Long id, String name, String metric, String condition,
                       Double threshold, String unit, String level, String status,
                       List<String> channels, Integer triggerCount, String lastTrigger, String appName) {
        this.id = id;
        this.name = name;
        this.metric = metric;
        this.condition = condition;
        this.threshold = threshold;
        this.unit = unit;
        this.level = level;
        this.status = status;
        this.channels = channels;
        this.triggerCount = triggerCount;
        this.lastTrigger = lastTrigger;
        this.appName = appName;
    }
}
