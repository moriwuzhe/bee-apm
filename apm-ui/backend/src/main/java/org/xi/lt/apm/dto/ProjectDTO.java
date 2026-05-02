package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProjectDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String groupName;
    private String environment;
    private String description;
    private String owner;
    private String status;
    private Integer appCount;

    public ProjectDTO() {}

    public ProjectDTO(Long id, String name, String groupName, String environment,
                     String description, String owner, String status, Integer appCount) {
        this.id = id;
        this.name = name;
        this.groupName = groupName;
        this.environment = environment;
        this.description = description;
        this.owner = owner;
        this.status = status;
        this.appCount = appCount;
    }
}
