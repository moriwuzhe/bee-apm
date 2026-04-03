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

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiResult;
import org.xi.lt.server.web.diagnostic.serverside.util.ResultHelper;
import org.xi.lt.server.web.diagnostic.ui.model.PrivateToken;
import org.xi.lt.server.web.diagnostic.ui.security.LoginContext;
import org.xi.lt.server.web.diagnostic.ui.service.GitPrivateTokenService;

import javax.annotation.Resource;
import java.util.Optional;

/**
 * @author keli.wang
 */
@Controller
@RequestMapping("/api/settings/token")
public class PrivateTokenApiController {
    @Resource
    private GitPrivateTokenService gitPrivateTokenService;


    @RequestMapping(value = "/save", method = RequestMethod.POST)
    @ResponseBody
    public ApiResult saveToken(@RequestParam final String privateToken) {
        final String username = LoginContext.getLoginContext().getLoginUser();
        final int ret = gitPrivateTokenService.saveToken(username, privateToken);
        if (ret > 0) {
            return ResultHelper.success();
        } else {
            return ResultHelper.fail("保存 Git Private Token 失败");
        }
    }

    @RequestMapping("/query")
    @ResponseBody
    public ApiResult<PrivateToken> queryToken() {
        final String userCode = LoginContext.getLoginContext().getLoginUser();
        Optional<PrivateToken> privateToken = gitPrivateTokenService.queryToken(userCode);
        if (!privateToken.isPresent()) {
            return ResultHelper.fail(-2, "请先配置private token");
        }
        return ResultHelper.success(privateToken.get());
    }
}
