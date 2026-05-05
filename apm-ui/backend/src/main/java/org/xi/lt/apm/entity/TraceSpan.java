package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "apm_trace_span", indexes = {
    @Index(name = "idx_trace_id", columnList = "trace_id"),
    @Index(name = "idx_app_name", columnList = "app_name"),
    @Index(name = "idx_span_type", columnList = "span_type"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
@EqualsAndHashCode(callSuper = true)
public class TraceSpan extends BaseEntity {

    @Column(name = "trace_id", length = 64)
    private String traceId;

    @Column(name = "span_type", length = 64)
    private String spanType;

    @Column(name = "app_name", length = 128)
    private String appName;

    @Column(name = "service_name", length = 128)
    private String serviceName;

    @Column(name = "method_name", length = 128)
    private String methodName;

    @Column(name = "env", length = 32)
    private String env;

    @Column(name = "instance_name", length = 128)
    private String instanceName;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "port")
    private Integer port;

    @Column(name = "process_id", length = 64)
    private String processId;

    @Column(name = "group_id", length = 64)
    private String groupId;

    @Column(name = "parent_id", length = 64)
    private String parentId;

    @Column(name = "duration")
    private Long duration;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "success")
    private Boolean success;

    @Column(name = "error_msg", length = 512)
    private String errorMsg;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    @Transient
    private Map<String, Object> tagMap;
}
