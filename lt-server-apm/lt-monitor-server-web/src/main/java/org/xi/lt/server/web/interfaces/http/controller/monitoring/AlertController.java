package org.xi.lt.server.web.interfaces.http.controller.monitoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.domain.model.alert.AlertRow;
import org.xi.lt.server.domain.repository.UnifiedDataStore;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

import java.util.List;

/**
 * Alert 控制器
 * 通过 UnifiedDataStore 访问基础设施层，符合 DDD 分层架构
 */
@RestController
@RequestMapping("/api/alert")
public class AlertController {
    private static final Logger log = LoggerFactory.getLogger(AlertController.class);

    @Autowired
    private UnifiedDataStore dataStore;  // ✅ 依赖 Domain 层的接口

    @GetMapping("/list")
    public ApiResult<List<AlertRow>> listAlerts(@RequestParam(required = false) String app,
                                                           @RequestParam(defaultValue = "100") int limit) {
        try {
            // ✅ 通过 Infrastructure 层查询
            List<AlertRow> result = dataStore.searchAlerts(app, limit);
            return ResultHelper.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch alerts", e);
            return ResultHelper.fail(e.getMessage());
        }
    }
}
