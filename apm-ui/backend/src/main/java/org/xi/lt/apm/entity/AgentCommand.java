package org.xi.lt.apm.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@Entity
@Table(name = "apm_agent_command")
@EqualsAndHashCode(callSuper = true)
public class AgentCommand extends BaseEntity {

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "command_type", length = 64)
    private String commandType;

    @Column(name = "command_data", columnDefinition = "TEXT")
    private String commandData;

    @Column(name = "status", length = 32)
    private String status = "pending";

    @Column(name = "result_data", columnDefinition = "TEXT")
    private String resultData;

    @Column(name = "error_message", length = 1024)
    private String errorMessage;

    @Column(name = "executed_at")
    private java.time.LocalDateTime executedAt;
}
