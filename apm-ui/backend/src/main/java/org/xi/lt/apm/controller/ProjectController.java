package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.ProjectDTO;
import org.xi.lt.apm.entity.Project;
import org.xi.lt.apm.service.ProjectService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    public Result<List<ProjectDTO>> getAll() {
        return Result.success(projectService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<ProjectDTO> getById(@PathVariable Long id) {
        Optional<ProjectDTO> project = projectService.findByIdDTO(id);
        return project.map(Result::success)
            .orElseGet(() -> Result.error("Project not found"));
    }

    @GetMapping("/env/{env}")
    public Result<List<ProjectDTO>> getByEnv(@PathVariable String env) {
        return Result.success(projectService.findByEnvDTO(env));
    }

    @GetMapping("/status/{status}")
    public Result<List<ProjectDTO>> getByStatus(@PathVariable String status) {
        List<Project> projects = projectService.findByStatus(status);
        return Result.success(projects.stream()
            .map(project -> projectService.findByIdDTO(project.getId()).orElse(null))
            .filter(java.util.Objects::nonNull)
            .collect(java.util.stream.Collectors.toList()));
    }

    @PostMapping
    public Result<ProjectDTO> create(@RequestBody ProjectDTO projectDTO) {
        return Result.success(projectService.saveDTO(projectDTO));
    }

    @PutMapping("/{id}")
    public Result<ProjectDTO> update(@PathVariable Long id, @RequestBody ProjectDTO projectDTO) {
        ProjectDTO updated = projectService.updateDTO(id, projectDTO);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Project not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        projectService.deleteById(id);
        return Result.success();
    }

    @GetMapping("/search")
    public Result<List<ProjectDTO>> search(@RequestParam String keyword) {
        return Result.success(projectService.searchDTO(keyword));
    }
}
