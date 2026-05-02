package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.util.List;

@Data
@Entity
@Table(name = "apm_alert_rule")
@EqualsAndHashCode(callSuper = true)
public class AlertRule extends BaseEntity {

    @Column(name = "name", length = 128)
    private String name;

    @Column(name = "metric", length = 64)
    private String metric;

    @Column(name = "condition", length = 16)
    private String condition;

    @Column(name = "threshold")
    private Double threshold;

    @Column(name = "unit", length = 32)
    private String unit;

    @Column(name = "level", length = 32)
    private String level;

    @Column(name = "status", length = 32)
    private String status = "enabled";

    @Column(name = "channels", length = 256)
    private String channels;

    @Column(name = "trigger_count")
    private Integer triggerCount = 0;

    @Column(name = "last_trigger")
    private String lastTrigger;

    @Column(name = "app_name", length = 128)
    private String appName;
}
