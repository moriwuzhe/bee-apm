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

package org.xi.lt.server.web.api.util;

import org.xi.lt.server.web.api.bean.ApiResult;
import org.xi.lt.server.web.api.bean.ApiStatus;

/**
 * Adapted to lt-monitor
 */
public class ResultHelper {

    public static ApiResult success() {

        return new ApiResult<>(String.valueOf(ApiStatus.SUCCESS.getCode()), "成功", null);
    }

    public static <T> ApiResult success(T data) {

        return new ApiResult<>(String.valueOf(ApiStatus.SUCCESS.getCode()), "成功", data);
    }

    public static <T> ApiResult success(int code, String message, T data) {

        return new ApiResult<>(String.valueOf(code), message, data);
    }

    public static <T> ApiResult success(String message, T data) {

        return new ApiResult<>(String.valueOf(ApiStatus.SUCCESS.getCode()), message, data);
    }

    public static ApiResult fail(String message) {

        return new ApiResult<>(String.valueOf(ApiStatus.SYSTEM_ERROR.getCode()), message, null);
    }

    public static ApiResult fail(int status, String message) {

        return new ApiResult<>(String.valueOf(status), message, null);
    }

    public static <T> ApiResult fail(int status, String message, T data) {

        return new ApiResult<>(String.valueOf(status), message, data);
    }

    public static ApiResult fromStatus(ApiStatus apiStatus) {

        return new ApiResult<>(String.valueOf(apiStatus.getCode()), apiStatus.getMsg(), null);
    }
}
