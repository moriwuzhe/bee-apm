package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.HealthCheckDTO;
import org.xi.lt.apm.service.HealthCheckService;

import java.util.List;

@RestController
@RequestMapping("/api/health-check")
@CrossOrigin(origins = "*")
public class HealthCheckController {

    @Autowired
    private HealthCheckService healthCheckService;

    @GetMapping
    public Result<List<HealthCheckDTO>> getServiceStatus() {
        return Result.success(healthCheckService.getServiceStatus());
    }
}