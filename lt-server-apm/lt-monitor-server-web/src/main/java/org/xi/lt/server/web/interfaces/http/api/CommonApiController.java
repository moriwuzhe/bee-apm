package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.application.usecase.common.CommonUseCase;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.web.interfaces.http.api.dto.CommonGetGroupListRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.CommonQueryByIdRequest;
import org.xi.lt.server.web.shared.api.ApiResult;

import java.util.List;

@RestController
public class CommonApiController {
    @Autowired
    private CommonUseCase useCase;

    @PostMapping("/api/common/getGroupList")
    public ApiResult<List<KeyValue>> getGroupList(@RequestBody CommonGetGroupListRequest req) {
        return useCase.getGroupList(req);
    }

    @PostMapping("/api/common/queryById")
    public ApiResult<Object> queryById(@RequestBody CommonQueryByIdRequest req) {
        return useCase.queryById(req);
    }
}
