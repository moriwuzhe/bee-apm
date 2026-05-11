package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_agent_config")
@EqualsAndHashCode(callSuper = true)
public class AgentConfig extends BaseEntity {

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "config_key", nullable = false, length = 256)
    private String configKey;

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "config_type", length = 32)
    private String configType = "string";

    @Column(name = "is_overridden", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isOverridden = false;
}
