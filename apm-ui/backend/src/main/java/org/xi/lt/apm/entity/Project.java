package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "apm_project")
@EqualsAndHashCode(callSuper = true)
public class Project extends BaseEntity {

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "group_name", length = 64)
    private String groupName;

    @Column(name = "env", length = 32)
    private String env;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "owner", length = 64)
    private String owner;

    @Column(name = "status", length = 32)
    private String status = "online";

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Application> applications = new HashSet<>();
}
