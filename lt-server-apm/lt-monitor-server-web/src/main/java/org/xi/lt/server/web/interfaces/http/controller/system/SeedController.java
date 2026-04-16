package org.xi.lt.server.web.interfaces.http.controller.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.seed.SeedService;
import org.xi.lt.server.domain.model.seed.SeedResult;
import org.xi.lt.server.web.interfaces.http.dto.SeedAllRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

@RestController
public class SeedController {
    @Value("${seed.enabled:false}")
    private boolean enabled;

    @Autowired
    private SeedService seedService;

    @PostMapping("/api/admin/seed/all")
    public ApiResult<SeedResult> seedAll(@RequestBody(required = false) SeedAllRequest req) {
        if (!enabled) return ResultHelper.fail("seed.disabled");
        try {
            int hours = req == null || req.getHours() == null ? 2 : req.getHours();
            int apps = req == null || req.getApps() == null ? 2 : req.getApps();
            int instPerApp = req == null || req.getInstPerApp() == null ? 2 : req.getInstPerApp();
            int reqPerApp = req == null || req.getReqPerApp() == null ? 120 : req.getReqPerApp();
            SeedResult r = seedService.seedAll(hours, apps, instPerApp, reqPerApp);
            return ResultHelper.success(r);
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

}

