package org.xi.lt.server.web.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.common.model.apm.Span;
import org.xi.lt.common.utils.JsonUtils;

import java.util.List;

/**
 * APM数据上报接口
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
@RestController
@RequestMapping("/apm")
public class ApmReportController {

    private static final Logger log = LoggerFactory.getLogger(ApmReportController.class);

    /**
     * 接收Agent上报的Span数据
     * @param spanList Span列表
     * @return 上报结果
     */
    @PostMapping("/report")
    public String report(@RequestBody List<Span> spanList) {
        log.info("收到APM上报数据，共{}条Span", spanList.size());
        for (Span span : spanList) {
            log.debug("Span数据：{}", JsonUtils.toJsonString(span));
            // TODO 后续实现ES存储逻辑
        }
        return "success";
    }

    /**
     * 接收单条Span上报
     * @param span Span数据
     * @return 上报结果
     */
    @PostMapping("/report/single")
    public String reportSingle(@RequestBody Span span) {
        log.info("收到单条Span上报：traceId={}, operationName={}", span.getTraceId(), span.getOperationName());
        // TODO 后续实现ES存储逻辑
        return "success";
    }
}
