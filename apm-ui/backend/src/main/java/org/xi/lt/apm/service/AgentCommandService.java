package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.entity.AgentCommand;
import org.xi.lt.apm.repository.AgentCommandRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AgentCommandService {

    @Autowired
    private AgentCommandRepository agentCommandRepository;

    public List<AgentCommand> getCommandsByAgentId(Long agentId) {
        return agentCommandRepository.findByAgentIdOrderByCreatedAtDesc(agentId);
    }

    public Optional<AgentCommand> getCommandById(Long id) {
        return agentCommandRepository.findById(id);
    }

    public AgentCommand sendCommand(Long agentId, String commandType, String commandData) {
        AgentCommand command = new AgentCommand();
        command.setAgentId(agentId);
        command.setCommandType(commandType);
        command.setCommandData(commandData);
        command.setStatus("pending");
        return agentCommandRepository.save(command);
    }

    public AgentCommand executeCommand(Long id, String resultData) {
        Optional<AgentCommand> optional = agentCommandRepository.findById(id);
        if (optional.isPresent()) {
            AgentCommand command = optional.get();
            command.setStatus("completed");
            command.setResultData(resultData);
            command.setExecutedAt(LocalDateTime.now());
            return agentCommandRepository.save(command);
        }
        return null;
    }

    public AgentCommand failCommand(Long id, String errorMessage) {
        Optional<AgentCommand> optional = agentCommandRepository.findById(id);
        if (optional.isPresent()) {
            AgentCommand command = optional.get();
            command.setStatus("failed");
            command.setErrorMessage(errorMessage);
            command.setExecutedAt(LocalDateTime.now());
            return agentCommandRepository.save(command);
        }
        return null;
    }

    public void deleteCommand(Long id) {
        agentCommandRepository.deleteById(id);
    }
}
