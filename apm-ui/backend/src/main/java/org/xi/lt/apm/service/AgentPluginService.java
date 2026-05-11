package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.entity.AgentPlugin;
import org.xi.lt.apm.repository.AgentPluginRepository;

import java.util.List;
import java.util.Optional;

@Service
public class AgentPluginService {

    @Autowired
    private AgentPluginRepository agentPluginRepository;

    public List<AgentPlugin> getPluginsByAgentId(Long agentId) {
        return agentPluginRepository.findByAgentId(agentId);
    }

    public Optional<AgentPlugin> getPluginById(Long id) {
        return agentPluginRepository.findById(id);
    }

    public AgentPlugin savePlugin(AgentPlugin plugin) {
        return agentPluginRepository.save(plugin);
    }

    public AgentPlugin enablePlugin(Long id) {
        Optional<AgentPlugin> optional = agentPluginRepository.findById(id);
        if (optional.isPresent()) {
            AgentPlugin plugin = optional.get();
            plugin.setEnabled(true);
            return agentPluginRepository.save(plugin);
        }
        return null;
    }

    public AgentPlugin disablePlugin(Long id) {
        Optional<AgentPlugin> optional = agentPluginRepository.findById(id);
        if (optional.isPresent()) {
            AgentPlugin plugin = optional.get();
            plugin.setEnabled(false);
            return agentPluginRepository.save(plugin);
        }
        return null;
    }

    public void deletePlugin(Long id) {
        agentPluginRepository.deleteById(id);
    }

    public AgentPlugin updatePluginConfig(Long id, String configJson) {
        Optional<AgentPlugin> optional = agentPluginRepository.findById(id);
        if (optional.isPresent()) {
            AgentPlugin plugin = optional.get();
            plugin.setConfigJson(configJson);
            return agentPluginRepository.save(plugin);
        }
        return null;
    }
}
