package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "sys_permission")
@EqualsAndHashCode(callSuper = true)
public class Permission extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 128)
    private String code;

    @Column(name = "name", nullable = false, length = 64)
    private String name;

    @Column(name = "module", length = 64)
    private String module;

    @Column(name = "description", length = 512)
    private String description;
}
