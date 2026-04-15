package org.xi.lt.server.web.application.usecase.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.domain.repository.UnifiedDataStore;
import org.xi.lt.server.web.interfaces.http.api.dto.CommonGetGroupListRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.CommonQueryByIdRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

import java.util.List;

@Service
public class CommonUseCase {
    @Autowired
    private UnifiedDataStore unifiedDataStore;

    public ApiResult<List<KeyValue>> getGroupList(CommonGetGroupListRequest req) {
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());
        String group = req == null ? null : req.getGroup();

        String field = "env";
        if ("app".equals(group)) field = "app";
        if (!"env".equals(field) && !"app".equals(field)) field = "env";

        return ResultHelper.success(unifiedDataStore.groupList(beginMs, endMs, field));
    }

    public ApiResult<Object> queryById(CommonQueryByIdRequest req) {
        if (req == null) return ResultHelper.success(null);
        long beginMs = TimeParseUtils.parseMillis(req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req.getEndTime());
        return ResultHelper.success(unifiedDataStore.queryById(req.getIndex(), req.getId(), beginMs, endMs));
    }
}
