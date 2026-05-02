package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "apm_release")
@EqualsAndHashCode(callSuper = true)
public class Release extends BaseEntity {

    @Column(name = "app_name", length = 128)
    private String appName;

    @Column(name = "version", length = 64)
    private String version;

    @Column(name = "prev_version", length = 64)
    private String prevVersion;

    @Column(name = "env", length = 32)
    private String env;

    @Column(name = "status", length = 32)
    private String status = "online";

    @Column(name = "operator", length = 64)
    private String operator;

    @Column(name = "changes", columnDefinition = "text")
    private String changes;

    @Column(name = "impact_services")
    private Integer impactServices = 0;

    @Column(name = "impact_apis")
    private Integer impactApis = 0;

    @Column(name = "impact_instances")
    private Integer impactInstances = 0;

    @Column(name = "alerts_count")
    private Integer alertsCount = 0;
}
