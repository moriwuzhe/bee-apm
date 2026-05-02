package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.ApplicationDTO;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.service.ApplicationService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public Result<List<ApplicationDTO>> getAll() {
        return Result.success(applicationService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<ApplicationDTO> getById(@PathVariable Long id) {
        Optional<ApplicationDTO> app = applicationService.findByIdDTO(id);
        return app.map(Result::success)
            .orElseGet(() -> Result.error("Application not found"));
    }

    @GetMapping("/project/{projectId}")
    public Result<List<ApplicationDTO>> getByProjectId(@PathVariable Long projectId) {
        return Result.success(applicationService.findByProjectIdDTO(projectId));
    }

    @GetMapping("/status/{status}")
    public Result<List<ApplicationDTO>> getByStatus(@PathVariable String status) {
        return Result.success(applicationService.findByStatusDTO(status));
    }

    @PostMapping
    public Result<ApplicationDTO> create(@RequestBody ApplicationDTO appDTO) {
        return Result.success(applicationService.saveDTO(appDTO));
    }

    @PutMapping("/{id}")
    public Result<ApplicationDTO> update(@PathVariable Long id, @RequestBody ApplicationDTO appDTO) {
        ApplicationDTO updated = applicationService.updateDTO(id, appDTO);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Application not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        applicationService.deleteById(id);
        return Result.success();
    }

    @GetMapping("/search")
    public Result<List<ApplicationDTO>> search(@RequestParam String keyword) {
        return Result.success(applicationService.searchDTO(keyword));
    }
}
