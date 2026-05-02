package org.xi.lt.apm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.PermissionDTO;
import org.xi.lt.apm.entity.Permission;
import org.xi.lt.apm.repository.PermissionRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private static final Logger logger = LoggerFactory.getLogger(PermissionService.class);

    @Autowired
    private PermissionRepository permissionRepository;

    public List<Permission> findAll() {
        return permissionRepository.findAll();
    }

    public List<PermissionDTO> findAllDTO() {
        try {
            return permissionRepository.findAll().stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error finding all permissions", e);
            throw e;
        }
    }

    public Optional<Permission> findById(Long id) {
        return permissionRepository.findById(id);
    }

    public Optional<PermissionDTO> findByIdDTO(Long id) {
        return permissionRepository.findById(id).map(this::toDTO);
    }

    public List<Permission> findByModule(String module) {
        return permissionRepository.findByModule(module);
    }

    public List<PermissionDTO> findByModuleDTO(String module) {
        return permissionRepository.findByModule(module).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Permission save(Permission permission) {
        return permissionRepository.save(permission);
    }

    public PermissionDTO saveDTO(PermissionDTO permissionDTO) {
        try {
            logger.info("Saving permission: {}", permissionDTO.getCode());
            Permission permission = toEntity(permissionDTO);
            Permission saved = permissionRepository.save(permission);
            logger.info("Permission saved with id: {}", saved.getId());
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error saving permission", e);
            throw e;
        }
    }

    public PermissionDTO updateDTO(Long id, PermissionDTO permissionDTO) {
        try {
            logger.info("Updating permission with id: {}", id);
            Optional<Permission> existing = permissionRepository.findById(id);
            if (!existing.isPresent()) {
                logger.warn("Permission not found with id: {}", id);
                return null;
            }

            Permission permission = existing.get();

            if (permissionDTO.getName() != null) {
                permission.setName(permissionDTO.getName());
            }
            if (permissionDTO.getModule() != null) {
                permission.setModule(permissionDTO.getModule());
            }
            if (permissionDTO.getDescription() != null) {
                permission.setDescription(permissionDTO.getDescription());
            }
            if (permissionDTO.getCode() != null) {
                permission.setCode(permissionDTO.getCode());
            }

            Permission saved = permissionRepository.save(permission);
            logger.info("Permission updated successfully");
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error updating permission with id: {}", id, e);
            throw e;
        }
    }

    public void deleteById(Long id) {
        try {
            logger.info("Deleting permission with id: {}", id);
            permissionRepository.deleteById(id);
            logger.info("Permission deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting permission with id: {}", id, e);
            throw e;
        }
    }

    private Permission toEntity(PermissionDTO dto) {
        Permission permission = new Permission();
        permission.setCode(dto.getCode());
        permission.setName(dto.getName());
        permission.setModule(dto.getModule());
        permission.setDescription(dto.getDescription());
        return permission;
    }

    private PermissionDTO toDTO(Permission permission) {
        return new PermissionDTO(
            permission.getId(),
            permission.getCode(),
            permission.getName(),
            permission.getModule(),
            permission.getDescription()
        );
    }
}