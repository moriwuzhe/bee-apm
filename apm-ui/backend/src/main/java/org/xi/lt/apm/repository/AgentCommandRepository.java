package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.AgentCommand;

import java.util.List;

@Repository
public interface AgentCommandRepository extends JpaRepository<AgentCommand, Long> {
    List<AgentCommand> findByAgentIdOrderByCreatedAtDesc(Long agentId);
    List<AgentCommand> findByAgentIdAndStatus(Long agentId, String status);
}
