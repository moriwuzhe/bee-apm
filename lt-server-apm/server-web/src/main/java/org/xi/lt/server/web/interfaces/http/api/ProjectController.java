package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.web.application.project.ProjectService;
import org.xi.lt.server.web.domain.model.Project;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping("/list")
    public ApiResult list() {
        return ResultHelper.success(projectService.list());
    }

    @PostMapping("/create")
    public ApiResult create(@RequestBody Project project) {
        try {
            projectService.create(project);
            return ResultHelper.success(null);
        } catch (IllegalArgumentException e) {
            return ResultHelper.fail(-1, e.getMessage());
        } catch (Exception e) {
            return ResultHelper.fail(-1, "create project failed");
        }
    }
}
