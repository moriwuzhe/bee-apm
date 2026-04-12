package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.tx.TxUseCase;
import org.xi.lt.server.web.domain.model.span.SpanView;
import org.xi.lt.server.web.interfaces.http.api.dto.TxListRequest;
import org.xi.lt.server.web.shared.model.PageResult;

@RestController
public class TxApiController {
    @Autowired
    private TxUseCase useCase;

    @PostMapping("/api/tx/list")
    public PageResult<SpanView> list(@RequestBody TxListRequest req) {
        return useCase.list(req);
    }
}

