package org.xi.lt.server.web.application.project;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.repository.ProjectDao;
import org.xi.lt.server.domain.model.Project;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    @Autowired
    private ProjectDao projectDao;

    public List<Project> list() {
        return projectDao.findAll();
    }

    public void create(Project project) {
        if (project == null || project.getProjectCode() == null || project.getProjectName() == null) {
            throw new IllegalArgumentException("projectCode and projectName are required");
        }

        Project existing = projectDao.findByProjectCode(project.getProjectCode());
        if (existing != null) {
            throw new IllegalArgumentException("projectCode already exists");
        }

        if (project.getSecretKey() == null || project.getSecretKey().isEmpty()) {
            project.setSecretKey(UUID.randomUUID().toString());
        }
        projectDao.insert(project);
    }
}
