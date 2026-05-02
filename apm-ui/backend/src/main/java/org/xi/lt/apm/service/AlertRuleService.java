package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xi.lt.apm.entity.AlertRule;
import org.xi.lt.apm.repository.AlertRuleRepository;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AlertRuleService {

    @Autowired
    private AlertRuleRepository alertRuleRepository;

    public List<AlertRule> findAll() {
        return alertRuleRepository.findAll();
    }

    public Optional<AlertRule> findById(Long id) {
        return alertRuleRepository.findById(id);
    }

    public List<AlertRule> findByStatus(String status) {
        return alertRuleRepository.findByStatus(status);
    }

    public List<AlertRule> findByAppName(String appName) {
        return alertRuleRepository.findByAppName(appName);
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
}
