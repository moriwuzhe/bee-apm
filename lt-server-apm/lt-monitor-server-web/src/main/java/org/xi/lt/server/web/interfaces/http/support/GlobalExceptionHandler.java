package org.xi.lt.server.web.interfaces.http.support;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResult<Void> badRequest(IllegalArgumentException e) {
        return ResultHelper.fail(202, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResult<Void> serverError(Exception e) {
        return ResultHelper.fail(e.getMessage());
    }
}
