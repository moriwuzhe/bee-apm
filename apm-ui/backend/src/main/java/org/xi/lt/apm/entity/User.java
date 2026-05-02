package org.xi.lt.apm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "sys_user")
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @Column(name = "name", nullable = false, length = 64)
    private String name;

    @Column(name = "account", nullable = false, unique = true, length = 64)
    private String account;

    @Column(name = "password", nullable = false, length = 256)
    private String password;

    @Column(name = "email", length = 128)
    private String email;

    @Column(name = "avatar", length = 512)
    private String avatar;

    @Column(name = "status", length = 32)
    private String status = "online";

    @Column(name = "last_login_at")
    private java.time.LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 64)
    private String lastLoginIp;

    @Column(name = "login_count")
    private Integer loginCount = 0;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "sys_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();
}