package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.logger.LoggerUseCase;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.web.interfaces.http.api.dto.LoggerListRequest;
import org.xi.lt.server.web.shared.model.PageResult;

@RestController
public class LoggerApiController {
    @Autowired
    private LoggerUseCase useCase;

    @PostMapping("/api/logger/list")
    public PageResult<SpanView> list(@RequestBody LoggerListRequest req) {
        return useCase.list(req);
    }
}

