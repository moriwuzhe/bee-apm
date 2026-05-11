package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.entity.AgentConfig;
import org.xi.lt.apm.repository.AgentConfigRepository;

import java.util.List;
import java.util.Optional;

@Service
public class AgentConfigService {

    @Autowired
    private AgentConfigRepository agentConfigRepository;

    public List<AgentConfig> getConfigsByAgentId(Long agentId) {
        return agentConfigRepository.findByAgentId(agentId);
    }

    public Optional<AgentConfig> getConfigById(Long id) {
        return agentConfigRepository.findById(id);
    }

    public AgentConfig saveConfig(AgentConfig config) {
        return agentConfigRepository.save(config);
    }

    public AgentConfig updateConfig(Long id, String value) {
        Optional<AgentConfig> optional = agentConfigRepository.findById(id);
        if (optional.isPresent()) {
            AgentConfig config = optional.get();
            config.setConfigValue(value);
            config.setIsOverridden(true);
            return agentConfigRepository.save(config);
        }
        return null;
    }

    public AgentConfig resetConfig(Long id) {
        Optional<AgentConfig> optional = agentConfigRepository.findById(id);
        if (optional.isPresent()) {
            AgentConfig config = optional.get();
            config.setIsOverridden(false);
            return agentConfigRepository.save(config);
        }
        return null;
    }

    public void deleteConfig(Long id) {
        agentConfigRepository.deleteById(id);
    }
}
