package org.xi.lt.server.web.application.project;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.repository.ApplicationDao;
import org.xi.lt.server.domain.model.Application;

import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationDao applicationDao;

    public List<Application> list(String projectCode) {
        if (projectCode != null && !projectCode.isEmpty()) {
            return applicationDao.findByProjectCode(projectCode);
        }
        return applicationDao.findAll();
    }

    public void create(Application application) {
        if (application == null || application.getAppCode() == null || application.getAppName() == null || application.getProjectCode() == null) {
            throw new IllegalArgumentException("projectCode, appCode, and appName are required");
        }

        Application existing = applicationDao.findByAppCode(application.getAppCode());
        if (existing != null) {
            throw new IllegalArgumentException("appCode already exists");
        }

        applicationDao.insert(application);
    }
}
