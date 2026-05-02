package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class UserDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String account;
    private String email;
    private String status;
    private String roleName;
    private List<String> roles;
    private String lastLoginTime;
    private String lastLoginIp;
    private Integer loginCount;
    private String createdAt;
    private String password;

    public UserDTO() {}

    public UserDTO(Long id, String name, String account, String email, String status,
                  String roleName, String lastLoginTime, String lastLoginIp,
                  Integer loginCount, String createdAt) {
        this.id = id;
        this.name = name;
        this.account = account;
        this.email = email;
        this.status = status;
        this.roleName = roleName;
        this.lastLoginTime = lastLoginTime;
        this.lastLoginIp = lastLoginIp;
        this.loginCount = loginCount;
        this.createdAt = createdAt;
    }
}