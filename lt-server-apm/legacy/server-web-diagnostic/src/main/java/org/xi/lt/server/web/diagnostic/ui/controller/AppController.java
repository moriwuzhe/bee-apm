/*
 * Copyright (C) 2019 Qunar, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

package org.xi.lt.server.web.diagnostic.ui.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import org.xi.lt.server.web.diagnostic.application.api.AdminAppService;
import org.xi.lt.server.web.diagnostic.application.api.AppServerService;
import org.xi.lt.server.web.diagnostic.application.api.AppService;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiResult;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiStatus;
import org.xi.lt.server.web.diagnostic.serverside.util.ResultHelper;
import org.xi.lt.server.web.diagnostic.ui.security.LoginContext;
import org.xi.lt.server.web.diagnostic.ui.service.UserService;

@Controller
public class AppController {

    private static final int ADMIN_PAGE_SIZE = 20;

    @Autowired
    private AppService appService;

    @Autowired
    private AdminAppService adminAppService;

    @Autowired
    private UserService userService;

    @Autowired
    private AppServerService appServerService;

    @RequestMapping("getApps")
    @ResponseBody
    public ApiResult getApps() {
        try {
            final String userName = LoginContext.getLoginContext().getLoginUser();
            return ResultHelper.success(appService.getApps(userName));
        } catch (Exception e) {
            return ResultHelper.fail(-1, "获取应用列表失败");
        }
    }

    @RequestMapping("isAdmin")
    @ResponseBody
    public ApiResult isAdmin() {
        String userName = LoginContext.getLoginContext().getLoginUser();
        return ResultHelper.success(userService.isAdmin(userName));
    }

    @RequestMapping("searchApps")
    @ResponseBody
    public ApiResult searchApps(String searchAppKey) {
        String userName = LoginContext.getLoginContext().getLoginUser();
        if (userService.isAdmin(userName)) {
            return ResultHelper.success(adminAppService.searchApps(searchAppKey, ADMIN_PAGE_SIZE));
        } else {
            return ResultHelper.fail(ApiStatus.PERMISSION_DENY.getCode(), ApiStatus.PERMISSION_DENY.getMsg());
        }
    }

    @RequestMapping("getHosts")
    @ResponseBody
    public ApiResult getHosts(@RequestParam(name = "appCode") String appCode) {
        return ResultHelper.success(this.appServerService.getAppServerByAppCode(appCode));
    }

    @ResponseBody
    @RequestMapping("getAppInfo")
    public ApiResult getAppInfo(@RequestParam("appCode") String appCode) {
        return ResultHelper.success(this.appService.getAppInfo(appCode));
    }

}
