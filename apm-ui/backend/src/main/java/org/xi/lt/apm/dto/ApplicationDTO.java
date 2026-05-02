package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ApplicationDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String status;
    private String ip;
    private String agentVersion;
    private String jvmVersion;
    private Double heapUsage;
    private String uptime;
    private Integer instanceCount;
    private Long projectId;
    private String projectName;

    public ApplicationDTO() {}

    public ApplicationDTO(Long id, String name, String status, String ip, String agentVersion,
                        String jvmVersion, Double heapUsage, String uptime, Integer instanceCount,
                        Long projectId, String projectName) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.ip = ip;
        this.agentVersion = agentVersion;
        this.jvmVersion = jvmVersion;
        this.heapUsage = heapUsage;
        this.uptime = uptime;
        this.instanceCount = instanceCount;
        this.projectId = projectId;
        this.projectName = projectName;
    }
}
