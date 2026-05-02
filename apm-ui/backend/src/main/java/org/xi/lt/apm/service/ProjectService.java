package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xi.lt.apm.dto.ProjectDTO;
import org.xi.lt.apm.entity.Project;
import org.xi.lt.apm.repository.ProjectRepository;
import org.xi.lt.apm.repository.ApplicationRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ApplicationRepository applicationRepository;

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public List<ProjectDTO> findAllDTO() {
        return projectRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<Project> findById(Long id) {
        return projectRepository.findById(id);
    }

    public Optional<ProjectDTO> findByIdDTO(Long id) {
        return projectRepository.findById(id).map(this::toDTO);
    }

    public List<Project> findByEnv(String env) {
        return projectRepository.findByEnv(env);
    }

    public List<ProjectDTO> findByEnvDTO(String env) {
        return projectRepository.findByEnv(env).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<Project> findByStatus(String status) {
        return projectRepository.findByStatus(status);
    }

    public List<Project> search(String keyword) {
        return projectRepository.findByNameContaining(keyword);
    }

    public List<ProjectDTO> searchDTO(String keyword) {
        return projectRepository.findByNameContaining(keyword).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Project save(Project project) {
        return projectRepository.save(project);
    }
    
    public ProjectDTO saveDTO(ProjectDTO projectDTO) {
        Project project = toEntity(projectDTO);
        Project saved = projectRepository.save(project);
        return toDTO(saved);
    }
    
    public ProjectDTO updateDTO(Long id, ProjectDTO projectDTO) {
        Optional<Project> existing = projectRepository.findById(id);
        if (existing.isPresent()) {
            Project project = existing.get();
            if (projectDTO.getName() != null) project.setName(projectDTO.getName());
            if (projectDTO.getGroupName() != null) project.setGroupName(projectDTO.getGroupName());
            if (projectDTO.getEnvironment() != null) project.setEnv(projectDTO.getEnvironment());
            if (projectDTO.getDescription() != null) project.setDescription(projectDTO.getDescription());
            if (projectDTO.getOwner() != null) project.setOwner(projectDTO.getOwner());
            if (projectDTO.getStatus() != null) project.setStatus(projectDTO.getStatus());
            Project saved = projectRepository.save(project);
            return toDTO(saved);
        }
        return null;
    }

    public void deleteById(Long id) {
        applicationRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }

    private ProjectDTO toDTO(Project project) {
        Integer appCount = applicationRepository.countByProjectId(project.getId());
        if (appCount == null) {
            appCount = 0;
        }
        return new ProjectDTO(
            project.getId(),
            project.getName(),
            project.getGroupName(),
            project.getEnv(),
            project.getDescription(),
            project.getOwner(),
            project.getStatus(),
            appCount
        );
    }
    
    private Project toEntity(ProjectDTO dto) {
        Project project = new Project();
        project.setName(dto.getName());
        project.setGroupName(dto.getGroupName());
        project.setEnv(dto.getEnvironment());
        project.setDescription(dto.getDescription());
        project.setOwner(dto.getOwner());
        project.setStatus(dto.getStatus());
        return project;
    }
}
