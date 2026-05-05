package org.xi.lt.apm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.UserDTO;
import org.xi.lt.apm.entity.Role;
import org.xi.lt.apm.entity.User;
import org.xi.lt.apm.repository.RoleRepository;
import org.xi.lt.apm.repository.UserRepository;

import java.util.HashSet;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<UserDTO> findAllDTO() {
        return userRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<UserDTO> findByIdDTO(Long id) {
        return userRepository.findById(id).map(this::toDTO);
    }

    public Optional<User> findByAccount(String account) {
        return userRepository.findByAccount(account);
    }

    public List<User> search(String keyword) {
        return userRepository.findByNameContainingOrAccountContaining(keyword, keyword);
    }

    public List<UserDTO> searchDTO(String keyword) {
        return userRepository.findByNameContainingOrAccountContaining(keyword, keyword).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public User save(User user) {
        return userRepository.save(user);
    }
    
    public UserDTO saveDTO(UserDTO userDTO) {
        User user = toEntity(userDTO);
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword("123456");
        }
        User saved = userRepository.save(user);
        return toDTO(saved);
    }
    
    public UserDTO updateDTO(Long id, UserDTO userDTO) {
        logger.info("Updating user with id: {}", id);
        
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            logger.warn("User not found with id: {}", id);
            return null;
        }
        
        if (userDTO.getName() != null) {
            user.setName(userDTO.getName());
            logger.info("Updated name to: {}", userDTO.getName());
        }
        if (userDTO.getAccount() != null) {
            user.setAccount(userDTO.getAccount());
            logger.info("Updated account to: {}", userDTO.getAccount());
        }
        if (userDTO.getEmail() != null) {
            user.setEmail(userDTO.getEmail());
            logger.info("Updated email to: {}", userDTO.getEmail());
        }
        if (userDTO.getStatus() != null) {
            user.setStatus(userDTO.getStatus());
            logger.info("Updated status to: {}", userDTO.getStatus());
        }
        
        if (userDTO.getRoles() != null && !userDTO.getRoles().isEmpty()) {
            Set<Role> roleSet = new HashSet<>();
            for (String roleName : userDTO.getRoles()) {
                roleRepository.findByName(roleName).ifPresent(roleSet::add);
            }
            user.setRoles(roleSet);
            logger.info("Updated roles to: {}", userDTO.getRoles());
        }
        
        User saved = userRepository.save(user);
        logger.info("User updated successfully: {}", saved.getId());
        return toDTO(saved);
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }
    
    private User toEntity(UserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setAccount(dto.getAccount());
        user.setEmail(dto.getEmail());
        user.setStatus(dto.getStatus());
        
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(dto.getPassword());
        }
        
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            Set<Role> roleSet = new HashSet<>();
            for (String roleName : dto.getRoles()) {
                roleRepository.findByName(roleName).ifPresent(roleSet::add);
            }
            user.setRoles(roleSet);
        }
        
        return user;
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO(
            user.getId(),
            user.getName(),
            user.getAccount(),
            user.getEmail(),
            user.getStatus(),
            user.getRoles() != null && !user.getRoles().isEmpty() 
                ? user.getRoles().iterator().next().getName() 
                : "",
            user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : "",
            user.getLastLoginIp(),
            user.getLoginCount(),
            user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
        );
        
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            dto.setRoles(user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }

    public List<String> getUserPermissions(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return Collections.emptyList();
        }
        
        User user = userOpt.get();
        return user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(permission -> permission.getCode())
            .distinct()
            .collect(Collectors.toList());
    }
}