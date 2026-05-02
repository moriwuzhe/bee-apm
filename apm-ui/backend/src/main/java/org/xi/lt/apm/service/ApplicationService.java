package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.ApplicationDTO;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.repository.ApplicationRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public List<Application> findAll() {
        return applicationRepository.findAll();
    }

    public List<ApplicationDTO> findAllDTO() {
        return applicationRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<Application> findById(Long id) {
        return applicationRepository.findById(id);
    }

    public Optional<ApplicationDTO> findByIdDTO(Long id) {
        return applicationRepository.findById(id).map(this::toDTO);
    }

    public List<Application> findByProjectId(Long projectId) {
        return applicationRepository.findByProjectId(projectId);
    }

    public List<ApplicationDTO> findByProjectIdDTO(Long projectId) {
        return applicationRepository.findByProjectId(projectId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<Application> findByStatus(String status) {
        return applicationRepository.findByStatus(status);
    }

    public List<ApplicationDTO> findByStatusDTO(String status) {
        return applicationRepository.findByStatus(status).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<Application> search(String keyword) {
        return applicationRepository.findByNameContaining(keyword);
    }

    public List<ApplicationDTO> searchDTO(String keyword) {
        return applicationRepository.findByNameContaining(keyword).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Application save(Application application) {
        return applicationRepository.save(application);
    }
    
    public ApplicationDTO saveDTO(ApplicationDTO appDTO) {
        Application app = toEntity(appDTO);
        Application saved = applicationRepository.save(app);
        return toDTO(saved);
    }
    
    public ApplicationDTO updateDTO(Long id, ApplicationDTO appDTO) {
        Optional<Application> existing = applicationRepository.findById(id);
        if (existing.isPresent()) {
            Application app = existing.get();
            if (appDTO.getName() != null) app.setName(appDTO.getName());
            if (appDTO.getStatus() != null) app.setStatus(appDTO.getStatus());
            if (appDTO.getIp() != null) app.setIp(appDTO.getIp());
            if (appDTO.getAgentVersion() != null) app.setAgentVersion(appDTO.getAgentVersion());
            if (appDTO.getJvmVersion() != null) app.setJvmVersion(appDTO.getJvmVersion());
            if (appDTO.getHeapUsage() != null) app.setHeapUsage(appDTO.getHeapUsage());
            if (appDTO.getUptime() != null) app.setUptime(appDTO.getUptime());
            if (appDTO.getInstanceCount() != null) app.setInstanceCount(appDTO.getInstanceCount());
            Application saved = applicationRepository.save(app);
            return toDTO(saved);
        }
        return null;
    }

    public void deleteById(Long id) {
        applicationRepository.deleteById(id);
    }
    
    private Application toEntity(ApplicationDTO dto) {
        Application app = new Application();
        app.setName(dto.getName());
        app.setStatus(dto.getStatus());
        app.setIp(dto.getIp());
        app.setAgentVersion(dto.getAgentVersion());
        app.setJvmVersion(dto.getJvmVersion());
        app.setHeapUsage(dto.getHeapUsage());
        app.setUptime(dto.getUptime());
        app.setInstanceCount(dto.getInstanceCount());
        return app;
    }

    private ApplicationDTO toDTO(Application app) {
        return new ApplicationDTO(
            app.getId(),
            app.getName(),
            app.getStatus(),
            app.getIp(),
            app.getAgentVersion(),
            app.getJvmVersion(),
            app.getHeapUsage(),
            app.getUptime(),
            app.getInstanceCount(),
            app.getProject() != null ? app.getProject().getId() : null,
            app.getProject() != null ? app.getProject().getName() : ""
        );
    }
}
