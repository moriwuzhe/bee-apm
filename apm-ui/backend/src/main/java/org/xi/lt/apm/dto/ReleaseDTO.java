package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

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
    private List<String> changes;
    private ImpactScope impact;
    private Integer alerts;
    private String time;

    @Data
    public static class ImpactScope implements Serializable {
        private static final long serialVersionUID = 1L;
        private Integer services;
        private Integer apis;
        private Integer instances;
    }

    public ReleaseDTO() {}

    public ReleaseDTO(Long id, String appName, String version, String prevVersion, String env,
                     String status, String operator, List<String> changes, Integer services,
                     Integer apis, Integer instances, Integer alerts, String time) {
        this.id = id;
        this.appName = appName;
        this.version = version;
        this.prevVersion = prevVersion;
        this.env = env;
        this.status = status;
        this.operator = operator;
        this.changes = changes;
        this.impact = new ImpactScope();
        this.impact.services = services;
        this.impact.apis = apis;
        this.impact.instances = instances;
        this.alerts = alerts;
        this.time = time;
    }
}
