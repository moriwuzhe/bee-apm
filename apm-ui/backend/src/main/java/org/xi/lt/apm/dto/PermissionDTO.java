package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class PermissionDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String code;
    private String name;
    private String module;
    private String description;

    public PermissionDTO() {}

    public PermissionDTO(Long id, String code, String name, String module, String description) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.module = module;
        this.description = description;
    }
}
