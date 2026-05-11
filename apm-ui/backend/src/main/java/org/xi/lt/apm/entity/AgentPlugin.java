package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_agent_plugin")
@EqualsAndHashCode(callSuper = true)
public class AgentPlugin extends BaseEntity {

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "plugin_name", nullable = false, length = 128)
    private String pluginName;

    @Column(name = "plugin_version", length = 32)
    private String pluginVersion;

    @Column(name = "status", length = 32)
    private String status = "online";

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "enabled", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean enabled = true;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
}
