package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_metric")
@EqualsAndHashCode(callSuper = true)
public class Metric extends BaseEntity {

    @Column(name = "app_name", length = 128)
    private String appName;

    @Column(name = "metric_type", length = 64)
    private String metricType;

    @Column(name = "time_point")
    private Long timePoint;

    @Column(name = "metric_value")
    private Double value;

    @Column(name = "value2")
    private Double value2;

    @Column(name = "value3")
    private Double value3;

    @Column(name = "value4")
    private Double value4;
}
