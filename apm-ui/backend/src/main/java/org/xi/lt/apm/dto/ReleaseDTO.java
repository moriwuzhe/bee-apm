package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ReleaseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String appName;
    private String version;
    private String prevVersion;
    private String env;
    private String status;
    private String operator;
    private String changes;
    private Integer impactServices;
    private Integer impactApis;
    private Integer impactInstances;
    private Integer alertsCount;
    private String createdAt;

    public ReleaseDTO() {}

    public ReleaseDTO(Long id, String appName, String version, String prevVersion, String env,
                     String status, String operator, String changes, Integer impactServices,
                     Integer impactApis, Integer impactInstances, Integer alertsCount, String createdAt) {
        this.id = id;
        this.appName = appName;
        this.version = version;
        this.prevVersion = prevVersion;
        this.env = env;
        this.status = status;
        this.operator = operator;
        this.changes = changes;
        this.impactServices = impactServices;
        this.impactApis = impactApis;
        this.impactInstances = impactInstances;
        this.alertsCount = alertsCount;
        this.createdAt = createdAt;
    }
}
