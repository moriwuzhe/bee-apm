package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.request.RequestUseCase;
import org.xi.lt.server.domain.model.request.CallTreeNode;
import org.xi.lt.server.domain.model.request.TopologyGraph;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.web.interfaces.http.api.dto.RequestGidTimeRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.RequestListRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.model.PageResult;

import java.util.List;

@RestController
public class RequestApiController {
    @Autowired
    private RequestUseCase useCase;

    @PostMapping("/api/request/list")
    public PageResult<SpanView> list(@RequestBody RequestListRequest req) {
        return useCase.list(req);
    }

    @PostMapping("/api/request/callTree")
    public ApiResult<List<CallTreeNode>> callTree(@RequestBody RequestGidTimeRequest req) {
        return useCase.callTree(req);
    }

    @PostMapping("/api/request/topology")
    public ApiResult<TopologyGraph> topology(@RequestBody RequestGidTimeRequest req) {
        return useCase.topology(req);
    }
}
