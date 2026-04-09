package org.xi.lt.server.web.diagnostic.ui.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiResult;
import org.xi.lt.server.web.diagnostic.serverside.util.ResultHelper;
import org.xi.lt.server.web.diagnostic.ui.dao.ProjectDao;
import org.xi.lt.server.web.diagnostic.ui.model.Project;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

    @Autowired
    private ProjectDao projectDao;

    @GetMapping("/list")
    public ApiResult list() {
        return ResultHelper.success(projectDao.findAll());
    }

    @PostMapping("/create")
    public ApiResult create(@RequestBody Project project) {
        if (project.getProjectCode() == null || project.getProjectName() == null) {
            return ResultHelper.fail(-1, "projectCode and projectName are required");
        }
        
        Project existing = projectDao.findByProjectCode(project.getProjectCode());
        if (existing != null) {
            return ResultHelper.fail(-1, "projectCode already exists");
        }

        // Generate a random secret key for the new project
        project.setSecretKey(UUID.randomUUID().toString());
        
        projectDao.insert(project);
        return ResultHelper.success(null);
    }
}
