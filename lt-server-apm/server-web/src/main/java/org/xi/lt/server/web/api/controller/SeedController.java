package org.xi.lt.server.web.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.api.seed.SeedService;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SeedController {
    @Value("${seed.enabled:false}")
    private boolean enabled;

    @Autowired
    private SeedService seedService;

    @PostMapping("/api/admin/seed/all")
    public Map<String, Object> seedAll(@RequestBody(required = false) Map<String, Object> req) {
        if (!enabled) return wrapError("seed.disabled");
        try {
            int hours = asInt(req == null ? null : req.get("hours"), 2);
            int apps = asInt(req == null ? null : req.get("apps"), 2);
            int instPerApp = asInt(req == null ? null : req.get("instPerApp"), 2);
            int reqPerApp = asInt(req == null ? null : req.get("reqPerApp"), 120);
            Map<String, Object> r = seedService.seedAll(hours, apps, instPerApp, reqPerApp);
            return wrapResult(r);
        } catch (Exception e) {
            return wrapError(e.getMessage());
        }
    }

    private static Map<String, Object> wrapResult(Object obj) {
        Map<String, Object> r = new HashMap<>();
        r.put("code", "0");
        r.put("msg", "成功");
        r.put("result", obj);
        return r;
    }

    private static Map<String, Object> wrapError(String msg) {
        Map<String, Object> r = new HashMap<>();
        r.put("code", "1");
        r.put("msg", msg == null ? "error" : msg);
        r.put("result", null);
        return r;
    }

    private static int asInt(Object o, int def) {
        if (o == null) return def;
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }
}

