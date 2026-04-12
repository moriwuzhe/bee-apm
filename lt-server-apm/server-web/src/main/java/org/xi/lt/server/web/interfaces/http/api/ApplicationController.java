package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.web.application.project.ApplicationService;
import org.xi.lt.server.web.domain.model.Application;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @GetMapping("/list")
    public ApiResult list(@RequestParam(required = false) String projectCode) {
        return ResultHelper.success(applicationService.list(projectCode));
    }

    @PostMapping("/create")
    public ApiResult create(@RequestBody Application application) {
        try {
            applicationService.create(application);
            return ResultHelper.success(null);
        } catch (IllegalArgumentException e) {
            return ResultHelper.fail(-1, e.getMessage());
        } catch (Exception e) {
            return ResultHelper.fail(-1, "create application failed");
        }
    }
}
