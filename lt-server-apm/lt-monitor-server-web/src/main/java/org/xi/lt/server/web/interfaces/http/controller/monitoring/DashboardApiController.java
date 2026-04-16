package org.xi.lt.server.web.interfaces.http.controller.monitoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.dashboard.DashboardUseCase;
import org.xi.lt.server.domain.model.dashboard.DashboardStatResult;
import org.xi.lt.server.domain.model.graph.GraphData;
import org.xi.lt.server.web.interfaces.http.dto.DashboardStatRequest;
import org.xi.lt.server.web.interfaces.http.dto.DashboardTopologyRequest;
import org.xi.lt.server.web.shared.api.ApiResult;

@RestController
public class DashboardApiController {
    @Autowired
    private DashboardUseCase useCase;

    @PostMapping("/api/dashboard/stat")
    public ApiResult<DashboardStatResult> stat(@RequestBody DashboardStatRequest req) {
        return useCase.stat(req);
    }

    @PostMapping("/api/dashboard/topology")
    public ApiResult<GraphData> globalTopology(@RequestBody DashboardTopologyRequest req) {
        return useCase.globalTopology(req);
    }
}

