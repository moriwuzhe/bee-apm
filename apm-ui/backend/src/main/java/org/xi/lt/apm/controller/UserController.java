package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.UserDTO;
import org.xi.lt.apm.entity.User;
import org.xi.lt.apm.service.UserService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public Result<List<UserDTO>> getAll() {
        return Result.success(userService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<UserDTO> getById(@PathVariable Long id) {
        Optional<UserDTO> user = userService.findByIdDTO(id);
        return user.map(Result::success)
            .orElseGet(() -> Result.error("User not found"));
    }

    @PostMapping
    public Result<UserDTO> create(@RequestBody UserDTO userDTO) {
        return Result.success(userService.saveDTO(userDTO));
    }

    @PutMapping("/{id}")
    public Result<UserDTO> update(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        UserDTO updated = userService.updateDTO(id, userDTO);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("User not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.deleteById(id);
        return Result.success();
    }

    @GetMapping("/search")
    public Result<List<UserDTO>> search(@RequestParam String keyword) {
        return Result.success(userService.searchDTO(keyword));
    }

    @GetMapping("/{id}/permissions")
    public Result<List<String>> getUserPermissions(@PathVariable Long id) {
        return Result.success(userService.getUserPermissions(id));
    }
}
