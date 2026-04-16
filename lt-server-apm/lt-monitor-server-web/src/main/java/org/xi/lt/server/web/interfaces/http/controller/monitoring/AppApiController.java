package org.xi.lt.server.web.interfaces.http.controller.monitoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.app.AppInfoUseCase;
import org.xi.lt.server.domain.model.app.AppInstanceView;
import org.xi.lt.server.web.interfaces.http.dto.AppInfoListRequest;
import org.xi.lt.server.web.shared.model.PageResult;

@RestController
public class AppApiController {
    @Autowired
    private AppInfoUseCase useCase;

    @PostMapping("/api/app/info/list")
    public PageResult<AppInstanceView> list(@RequestBody AppInfoListRequest req) {
        return useCase.list(req);
    }
}

