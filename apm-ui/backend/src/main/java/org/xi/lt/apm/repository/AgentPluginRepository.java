package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.AgentPlugin;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentPluginRepository extends JpaRepository<AgentPlugin, Long> {
    List<AgentPlugin> findByAgentId(Long agentId);
    Optional<AgentPlugin> findByAgentIdAndPluginName(Long agentId, String pluginName);
    List<AgentPlugin> findByAgentIdAndStatus(Long agentId, String status);
}
