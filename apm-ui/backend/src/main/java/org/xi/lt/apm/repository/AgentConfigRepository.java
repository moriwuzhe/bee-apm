package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.AgentConfig;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentConfigRepository extends JpaRepository<AgentConfig, Long> {
    List<AgentConfig> findByAgentId(Long agentId);
    Optional<AgentConfig> findByAgentIdAndConfigKey(Long agentId, String configKey);
}
