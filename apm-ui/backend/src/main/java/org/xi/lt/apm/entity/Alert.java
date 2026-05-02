package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_alert")
@EqualsAndHashCode(callSuper = true)
public class Alert extends BaseEntity {

    @Column(name = "app_name", length = 128)
    private String appName;

    @Column(name = "env", length = 32)
    private String env;

    @Column(name = "type", length = 64)
    private String type;

    @Column(name = "level", length = 32)
    private String level;

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "status", length = 32)
    private String status = "active";
}
