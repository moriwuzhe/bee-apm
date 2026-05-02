package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.RoleDTO;
import org.xi.lt.apm.entity.Role;
import org.xi.lt.apm.service.RoleService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping
    public Result<List<RoleDTO>> getAll() {
        return Result.success(roleService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<RoleDTO> getById(@PathVariable Long id) {
        Optional<RoleDTO> role = roleService.findByIdDTO(id);
        return role.map(Result::success)
            .orElseGet(() -> Result.error("Role not found"));
    }

    @PostMapping
    public Result<RoleDTO> create(@RequestBody RoleDTO roleDTO) {
        return Result.success(roleService.saveDTO(roleDTO));
    }

    @PutMapping("/{id}")
    public Result<RoleDTO> update(@PathVariable Long id, @RequestBody RoleDTO roleDTO) {
        RoleDTO updated = roleService.updateDTO(id, roleDTO);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Role not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        roleService.deleteById(id);
        return Result.success();
    }
}
