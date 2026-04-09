package org.xi.lt.server.web.diagnostic.ui.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiResult;
import org.xi.lt.server.web.diagnostic.serverside.util.ResultHelper;
import org.xi.lt.server.web.diagnostic.ui.dao.ApplicationDao;
import org.xi.lt.server.web.diagnostic.ui.model.Application;

import java.util.List;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {

    @Autowired
    private ApplicationDao applicationDao;

    @GetMapping("/list")
    public ApiResult list(@RequestParam(required = false) String projectCode) {
        if (projectCode != null && !projectCode.isEmpty()) {
            return ResultHelper.success(applicationDao.findByProjectCode(projectCode));
        }
        return ResultHelper.success(applicationDao.findAll());
    }

    @PostMapping("/create")
    public ApiResult create(@RequestBody Application application) {
        if (application.getAppCode() == null || application.getAppName() == null || application.getProjectCode() == null) {
            return ResultHelper.fail(-1, "projectCode, appCode, and appName are required");
        }
        
        Application existing = applicationDao.findByAppCode(application.getAppCode());
        if (existing != null) {
            return ResultHelper.fail(-1, "appCode already exists");
        }

        applicationDao.insert(application);
        return ResultHelper.success(null);
    }
}
