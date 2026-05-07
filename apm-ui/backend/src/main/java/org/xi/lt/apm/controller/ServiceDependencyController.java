package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.ServiceDependencyDTO;
import org.xi.lt.apm.service.ServiceDependencyService;

@RestController
@RequestMapping("/api/service-dep")
@CrossOrigin(origins = "*")
public class ServiceDependencyController {

    @Autowired
    private ServiceDependencyService serviceDependencyService;

    @GetMapping
    public Result<ServiceDependencyDTO> getDependencyData() {
        return Result.success(serviceDependencyService.getDependencyData());
    }
}