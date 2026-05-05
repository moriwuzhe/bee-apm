package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xi.lt.apm.dto.AlertRuleDTO;
import org.xi.lt.apm.entity.AlertRule;
import org.xi.lt.apm.repository.AlertRuleRepository;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AlertRuleService {

    @Autowired
    private AlertRuleRepository alertRuleRepository;

    public List<AlertRule> findAll() {
        return alertRuleRepository.findAll();
    }

    public List<AlertRuleDTO> findAllDTO() {
        return alertRuleRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<AlertRule> findById(Long id) {
        return alertRuleRepository.findById(id);
    }

    public Optional<AlertRuleDTO> findByIdDTO(Long id) {
        return alertRuleRepository.findById(id).map(this::toDTO);
    }

    public List<AlertRule> findByStatus(String status) {
        return alertRuleRepository.findByStatus(status);
    }

    public List<AlertRuleDTO> findByStatusDTO(String status) {
        return alertRuleRepository.findByStatus(status).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<AlertRule> findByAppName(String appName) {
        return alertRuleRepository.findByAppName(appName);
    }

    public List<AlertRuleDTO> findByAppNameDTO(String appName) {
        return alertRuleRepository.findByAppName(appName).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public AlertRule save(AlertRule alertRule) {
        if (alertRule.getTriggerCount() == null) {
            alertRule.setTriggerCount(0);
        }
        if (alertRule.getStatus() == null) {
            alertRule.setStatus("enabled");
        }
        return alertRuleRepository.save(alertRule);
    }

    public AlertRuleDTO saveDTO(AlertRuleDTO dto) {
        AlertRule entity = toEntity(dto);
        AlertRule saved = save(entity);
        return toDTO(saved);
    }

    public AlertRule update(Long id, AlertRule alertRule) {
        Optional<AlertRule> existing = alertRuleRepository.findById(id);
        if (existing.isPresent()) {
            AlertRule entity = existing.get();
            if (alertRule.getName() != null) {
                entity.setName(alertRule.getName());
            }
            if (alertRule.getMetric() != null) {
                entity.setMetric(alertRule.getMetric());
            }
            if (alertRule.getCondition() != null) {
                entity.setCondition(alertRule.getCondition());
            }
            if (alertRule.getThreshold() != null) {
                entity.setThreshold(alertRule.getThreshold());
            }
            if (alertRule.getUnit() != null) {
                entity.setUnit(alertRule.getUnit());
            }
            if (alertRule.getLevel() != null) {
                entity.setLevel(alertRule.getLevel());
            }
            if (alertRule.getStatus() != null) {
                entity.setStatus(alertRule.getStatus());
            }
            if (alertRule.getChannels() != null) {
                entity.setChannels(alertRule.getChannels());
            }
            if (alertRule.getAppName() != null) {
                entity.setAppName(alertRule.getAppName());
            }
            return alertRuleRepository.save(entity);
        }
        return null;
    }

    public AlertRuleDTO updateDTO(Long id, AlertRuleDTO dto) {
        Optional<AlertRule> existing = alertRuleRepository.findById(id);
        if (!existing.isPresent()) {
            return null;
        }
        AlertRule entity = existing.get();
        if (dto.getName() != null) {
            entity.setName(dto.getName());
        }
        if (dto.getMetric() != null) {
            entity.setMetric(dto.getMetric());
        }
        if (dto.getCondition() != null) {
            entity.setCondition(dto.getCondition());
        }
        if (dto.getThreshold() != null) {
            entity.setThreshold(dto.getThreshold());
        }
        if (dto.getUnit() != null) {
            entity.setUnit(dto.getUnit());
        }
        if (dto.getLevel() != null) {
            entity.setLevel(dto.getLevel());
        }
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        if (dto.getChannels() != null) {
            entity.setChannels(String.join(",", dto.getChannels()));
        }
        if (dto.getAppName() != null) {
            entity.setAppName(dto.getAppName());
        }
        AlertRule saved = alertRuleRepository.save(entity);
        return toDTO(saved);
    }

    public void deleteById(Long id) {
        alertRuleRepository.deleteById(id);
    }

    public AlertRule toggleStatus(Long id, String status) {
        Optional<AlertRule> existing = alertRuleRepository.findById(id);
        if (existing.isPresent()) {
            AlertRule entity = existing.get();
            entity.setStatus(status);
            return alertRuleRepository.save(entity);
        }
        return null;
    }

    public AlertRuleDTO toggleStatusDTO(Long id, String status) {
        AlertRule entity = toggleStatus(id, status);
        return entity != null ? toDTO(entity) : null;
    }

    private List<String> parseChannels(String channels) {
        if (channels == null || channels.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(channels.split(","));
    }

    private String joinChannels(List<String> channels) {
        if (channels == null || channels.isEmpty()) {
            return "";
        }
        return String.join(",", channels);
    }

    private AlertRule toEntity(AlertRuleDTO dto) {
        AlertRule entity = new AlertRule();
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        entity.setName(dto.getName());
        entity.setMetric(dto.getMetric());
        entity.setCondition(dto.getCondition());
        entity.setThreshold(dto.getThreshold());
        entity.setUnit(dto.getUnit());
        entity.setLevel(dto.getLevel());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "enabled");
        entity.setChannels(joinChannels(dto.getChannels()));
        entity.setTriggerCount(dto.getTriggerCount() != null ? dto.getTriggerCount() : 0);
        entity.setLastTrigger(dto.getLastTrigger());
        entity.setAppName(dto.getAppName());
        return entity;
    }

    private AlertRuleDTO toDTO(AlertRule entity) {
        return new AlertRuleDTO(
            entity.getId(),
            entity.getName(),
            entity.getMetric(),
            entity.getCondition(),
            entity.getThreshold(),
            entity.getUnit(),
            entity.getLevel(),
            entity.getStatus(),
            parseChannels(entity.getChannels()),
            entity.getTriggerCount() != null ? entity.getTriggerCount() : 0,
            entity.getLastTrigger(),
            entity.getAppName()
        );
    }
}
