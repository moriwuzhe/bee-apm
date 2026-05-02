package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.AlertRule;
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
    public Result<List<AlertRule>> getAll() {
        return Result.success(alertRuleService.findAll());
    }

    @GetMapping("/{id}")
    public Result<AlertRule> getById(@PathVariable Long id) {
        Optional<AlertRule> alertRule = alertRuleService.findById(id);
        return alertRule.map(Result::success)
            .orElseGet(() -> Result.error("Alert rule not found"));
    }

    @GetMapping("/status/{status}")
    public Result<List<AlertRule>> getByStatus(@PathVariable String status) {
        return Result.success(alertRuleService.findByStatus(status));
    }

    @GetMapping("/app/{appName}")
    public Result<List<AlertRule>> getByAppName(@PathVariable String appName) {
        return Result.success(alertRuleService.findByAppName(appName));
    }

    @PostMapping
    public Result<AlertRule> create(@RequestBody AlertRule alertRule) {
        return Result.success(alertRuleService.save(alertRule));
    }

    @PutMapping("/{id}")
    public Result<AlertRule> update(@PathVariable Long id, @RequestBody AlertRule alertRule) {
        AlertRule updated = alertRuleService.update(id, alertRule);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Alert rule not found");
    }

    @PutMapping("/{id}/status")
    public Result<AlertRule> toggleStatus(@PathVariable Long id, @RequestBody AlertRule alertRule) {
        AlertRule updated = alertRuleService.toggleStatus(id, alertRule.getStatus());
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
