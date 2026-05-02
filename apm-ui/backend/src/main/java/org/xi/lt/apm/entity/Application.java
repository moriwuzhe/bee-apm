package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_application")
@EqualsAndHashCode(callSuper = true)
public class Application extends BaseEntity {

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "status", length = 32)
    private String status = "online";

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "agent_version", length = 32)
    private String agentVersion;

    @Column(name = "jvm_version", length = 32)
    private String jvmVersion;

    @Column(name = "heap_usage")
    private Double heapUsage = 0.0;

    @Column(name = "uptime", length = 64)
    private String uptime;

    @Column(name = "instance_count")
    private Integer instanceCount = 1;

    @Column(name = "project_id")
    private Long projectId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;
}
