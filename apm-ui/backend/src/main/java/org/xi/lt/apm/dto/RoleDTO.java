package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class RoleDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String description;
    private String color;
    private Boolean isSystem;
    private Integer userCount;
    private Integer permissionCount;
    private List<PermissionDTO> permissions;

    public RoleDTO() {}

    public RoleDTO(Long id, String name, String description, String color,
                  Boolean isSystem, Integer userCount, Integer permissionCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color;
        this.isSystem = isSystem;
        this.userCount = userCount;
        this.permissionCount = permissionCount;
    }
}
