package org.xi.lt.server.web.application.project;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.repository.ApplicationRepository;
import org.xi.lt.server.domain.model.config.Application;

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public List<Application> list(String projectCode) {
        if (projectCode != null && !projectCode.isEmpty()) {
            return applicationRepository.findByProjectCode(projectCode);
        }
        return applicationRepository.findAll();
    }

    public void create(Application application) {
        if (application == null || application.getAppCode() == null || application.getAppName() == null || application.getProjectCode() == null) {
            throw new IllegalArgumentException("projectCode, appCode, and appName are required");
        }

        Application existing = applicationRepository.findByAppCode(application.getAppCode());
        if (existing != null) {
            throw new IllegalArgumentException("appCode already exists");
        }

        if (application.getAppSecretKey() == null || application.getAppSecretKey().isEmpty()) {
            application.setAppSecretKey(UUID.randomUUID().toString());
        }
        if (application.getAppType() == null || application.getAppType().isEmpty()) {
            application.setAppType("self-built"); // default to self-built
        }
        applicationRepository.insert(application);
    }
}
