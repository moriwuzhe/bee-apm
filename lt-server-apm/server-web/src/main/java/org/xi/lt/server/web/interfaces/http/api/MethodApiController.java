package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.method.MethodUseCase;
import org.xi.lt.server.web.domain.model.span.SpanView;
import org.xi.lt.server.web.interfaces.http.api.dto.MethodListRequest;
import org.xi.lt.server.web.shared.model.PageResult;

@RestController
public class MethodApiController {
    @Autowired
    private MethodUseCase useCase;

    @PostMapping("/api/method/list")
    public PageResult<SpanView> list(@RequestBody MethodListRequest req) {
        return useCase.list(req);
    }
}

