package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.sql.SqlUseCase;
import org.xi.lt.server.web.domain.model.span.SpanView;
import org.xi.lt.server.web.interfaces.http.api.dto.SqlListRequest;
import org.xi.lt.server.web.shared.model.PageResult;

@RestController
public class SqlApiController {
    @Autowired
    private SqlUseCase useCase;

    @PostMapping("/api/sql/list")
    public PageResult<SpanView> list(@RequestBody SqlListRequest req) {
        return useCase.list(req);
    }
}

