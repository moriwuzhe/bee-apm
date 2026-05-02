package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.PermissionDTO;
import org.xi.lt.apm.entity.Permission;
import org.xi.lt.apm.service.PermissionService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/permissions")
@CrossOrigin(origins = "*")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public Result<List<PermissionDTO>> getAll() {
        return Result.success(permissionService.findAllDTO());
    }

    @GetMapping("/module/{module}")
    public Result<List<PermissionDTO>> getByModule(@PathVariable String module) {
        return Result.success(permissionService.findByModuleDTO(module));
    }

    @GetMapping("/{id}")
    public Result<PermissionDTO> getById(@PathVariable Long id) {
        Optional<PermissionDTO> permission = permissionService.findByIdDTO(id);
        return permission.map(Result::success)
                .orElseGet(() -> Result.error("Permission not found"));
    }

    @PostMapping
    public Result<PermissionDTO> create(@RequestBody PermissionDTO permissionDTO) {
        return Result.success(permissionService.saveDTO(permissionDTO));
    }

    @PutMapping("/{id}")
    public Result<PermissionDTO> update(@PathVariable Long id, @RequestBody PermissionDTO permissionDTO) {
        PermissionDTO updated = permissionService.updateDTO(id, permissionDTO);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Permission not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        permissionService.deleteById(id);
        return Result.success();
    }
}