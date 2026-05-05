package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.AlertRuleDTO;
import org.xi.lt.apm.service.AlertRuleService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/alert-rules")
@CrossOrigin(origins = "*")
public class AlertRuleController {

    @Autowired
    private AlertRuleService alertRuleService;

    @GetMapping
    public Result<List<AlertRuleDTO>> getAll() {
        return Result.success(alertRuleService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<AlertRuleDTO> getById(@PathVariable Long id) {
        Optional<AlertRuleDTO> alertRule = alertRuleService.findByIdDTO(id);
        return alertRule.map(Result::success)
            .orElseGet(() -> Result.error("Alert rule not found"));
    }

    @GetMapping("/status/{status}")
    public Result<List<AlertRuleDTO>> getByStatus(@PathVariable String status) {
        return Result.success(alertRuleService.findByStatusDTO(status));
    }

    @GetMapping("/app/{appName}")
    public Result<List<AlertRuleDTO>> getByAppName(@PathVariable String appName) {
        return Result.success(alertRuleService.findByAppNameDTO(appName));
    }

    @PostMapping
    public Result<AlertRuleDTO> create(@RequestBody AlertRuleDTO alertRule) {
        AlertRuleDTO saved = alertRuleService.saveDTO(alertRule);
        return Result.success(saved);
    }

    @PutMapping("/{id}")
    public Result<AlertRuleDTO> update(@PathVariable Long id, @RequestBody AlertRuleDTO alertRule) {
        AlertRuleDTO updated = alertRuleService.updateDTO(id, alertRule);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Alert rule not found");
    }

    @PutMapping("/{id}/status")
    public Result<AlertRuleDTO> toggleStatus(@PathVariable Long id, @RequestBody AlertRuleDTO alertRule) {
        AlertRuleDTO updated = alertRuleService.toggleStatusDTO(id, alertRule.getStatus());
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Alert rule not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        alertRuleService.deleteById(id);
        return Result.success();
    }
}
