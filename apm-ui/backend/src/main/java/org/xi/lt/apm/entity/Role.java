package org.xi.lt.apm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "sys_role")
@EqualsAndHashCode(callSuper = true)
public class Role extends BaseEntity {

    @Column(name = "name", nullable = false, length = 64)
    private String name;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "color", length = 16)
    private String color;

    @Column(name = "is_system")
    private Boolean isSystem = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "sys_role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @JsonIgnore
    private Set<Permission> permissions = new HashSet<>();
}