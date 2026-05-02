package org.xi.lt.apm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.RoleDTO;
import org.xi.lt.apm.entity.Role;
import org.xi.lt.apm.repository.RoleRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private static final Logger logger = LoggerFactory.getLogger(RoleService.class);

    @Autowired
    private RoleRepository roleRepository;

    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    public List<RoleDTO> findAllDTO() {
        try {
            return roleRepository.findAll().stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error finding all roles", e);
            throw e;
        }
    }

    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }

    public Optional<RoleDTO> findByIdDTO(Long id) {
        return roleRepository.findById(id).map(this::toDTO);
    }

    public Role save(Role role) {
        return roleRepository.save(role);
    }

    public RoleDTO saveDTO(RoleDTO roleDTO) {
        try {
            logger.info("Saving role: {}", roleDTO.getName());
            Role role = toEntity(roleDTO);
            if (role.getColor() == null || role.getColor().isEmpty()) {
                role.setColor("#165DFF");
            }
            if (role.getIsSystem() == null) {
                role.setIsSystem(false);
            }
            Role saved = roleRepository.save(role);
            logger.info("Role saved with id: {}", saved.getId());
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error saving role", e);
            throw e;
        }
    }

    public RoleDTO updateDTO(Long id, RoleDTO roleDTO) {
        try {
            logger.info("Updating role with id: {}", id);
            Optional<Role> existing = roleRepository.findById(id);
            if (!existing.isPresent()) {
                logger.warn("Role not found with id: {}", id);
                return null;
            }

            Role role = existing.get();

            if (roleDTO.getName() != null) {
                role.setName(roleDTO.getName());
            }
            if (roleDTO.getDescription() != null) {
                role.setDescription(roleDTO.getDescription());
            }
            if (roleDTO.getColor() != null) {
                role.setColor(roleDTO.getColor());
            }
            if (roleDTO.getIsSystem() != null) {
                role.setIsSystem(roleDTO.getIsSystem());
            }

            Role saved = roleRepository.save(role);
            logger.info("Role updated successfully");
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error updating role with id: {}", id, e);
            throw e;
        }
    }

    public void deleteById(Long id) {
        try {
            logger.info("Deleting role with id: {}", id);
            roleRepository.deleteById(id);
            logger.info("Role deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting role with id: {}", id, e);
            throw e;
        }
    }

    private Role toEntity(RoleDTO dto) {
        Role role = new Role();
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        role.setColor(dto.getColor());
        if (dto.getIsSystem() != null) {
            role.setIsSystem(dto.getIsSystem());
        }
        return role;
    }

    private RoleDTO toDTO(Role role) {
        return new RoleDTO(
            role.getId(),
            role.getName(),
            role.getDescription(),
            role.getColor(),
            role.getIsSystem(),
            0,
            0
        );
    }
}