package org.xi.lt.code.dynamic;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.model.span.tags.MethTags;
import org.xi.lt.server.domain.model.span.tags.ReqTags;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 演示 Span 数据生成器
 * 用于生成模拟的 Trace 数据进行测试
 */
@Slf4j
public class DemoSpanGenerator {

    /**
     * 生成演示用的 Trace 数据
     */
    public static List<SpanView> generateDemoTrace(String traceId) {
        List<SpanView> spans = new ArrayList<>();
        long baseTime = System.currentTimeMillis() - 10000;

        // 1. 入口请求
        SpanView reqSpan = createReqSpan(traceId, null, baseTime, 500L,
                "order-service", "instance-1", "POST", "/api/orders/create");
        spans.add(reqSpan);

        // 2. Controller 方法
        SpanView controllerSpan = createMethSpan(traceId, reqSpan.getId(), baseTime + 10, 480L,
                "order-service", "instance-1", "OrderController.createOrder");
        spans.add(controllerSpan);

        // 3. Service 方法
        SpanView serviceSpan = createMethSpan(traceId, controllerSpan.getId(), baseTime + 30, 400L,
                "order-service", "instance-1", "OrderService.createOrder");
        spans.add(serviceSpan);

        // 4. 数据库操作 1
        SpanView sqlSpan1 = createSqlSpan(traceId, serviceSpan.getId(), baseTime + 50, 100L,
                "order-service", "instance-1");
        spans.add(sqlSpan1);

        // 5. 调用用户服务
        SpanView userReqSpan = createReqSpan(traceId, serviceSpan.getId(), baseTime + 160, 80L,
                "user-service", "instance-2", "GET", "/api/users/123");
        spans.add(userReqSpan);

        // 6. 用户服务 Controller
        SpanView userControllerSpan = createMethSpan(traceId, userReqSpan.getId(), baseTime + 165, 70L,
                "user-service", "instance-2", "UserController.getUser");
        spans.add(userControllerSpan);

        // 7. 用户服务 Service
        SpanView userServiceSpan = createMethSpan(traceId, userControllerSpan.getId(), baseTime + 170, 50L,
                "user-service", "instance-2", "UserService.getUserById");
        spans.add(userServiceSpan);

        // 8. 用户服务数据库
        SpanView userSqlSpan = createSqlSpan(traceId, userServiceSpan.getId(), baseTime + 175, 30L,
                "user-service", "instance-2");
        spans.add(userSqlSpan);

        // 9. 数据库操作 2
        SpanView sqlSpan2 = createSqlSpan(traceId, serviceSpan.getId(), baseTime + 250, 150L,
                "order-service", "instance-1");
        spans.add(sqlSpan2);

        // 10. 事务
        SpanView txSpan = createTxSpan(traceId, serviceSpan.getId(), baseTime + 410, 20L,
                "order-service", "instance-1");
        spans.add(txSpan);

        log.info("生成演示 Trace 数据，traceId: {}, Span 数量: {}", traceId, spans.size());
        return spans;
    }

    /**
     * 创建请求类型 Span
     */
    private static SpanView createReqSpan(String traceId, String parentId, long time, Long spend,
                                           String app, String inst, String method, String url) {
        SpanView span = createBaseSpan(traceId, parentId, time, spend, app, inst);
        span.setType("req");

        ReqTags tags = new ReqTags();
        tags.setMethod(method);
        tags.setUrl(url);
        tags.setRemote("192.168.1.100");
        span.setTags(tags);

        return span;
    }

    /**
     * 创建方法类型 Span
     */
    private static SpanView createMethSpan(String traceId, String parentId, long time, Long spend,
                                            String app, String inst, String method) {
        SpanView span = createBaseSpan(traceId, parentId, time, spend, app, inst);
        span.setType("meth");

        MethTags tags = new MethTags();
        tags.setMethod(method);
        tags.setParam("...");
        span.setTags(tags);

        return span;
    }

    /**
     * 创建 SQL 类型 Span
     */
    private static SpanView createSqlSpan(String traceId, String parentId, long time, Long spend,
                                           String app, String inst) {
        SpanView span = createBaseSpan(traceId, parentId, time, spend, app, inst);
        span.setType("sql");
        return span;
    }

    /**
     * 创建事务类型 Span
     */
    private static SpanView createTxSpan(String traceId, String parentId, long time, Long spend,
                                          String app, String inst) {
        SpanView span = createBaseSpan(traceId, parentId, time, spend, app, inst);
        span.setType("tx");
        return span;
    }

    /**
     * 创建基础 Span
     */
    private static SpanView createBaseSpan(String traceId, String parentId, long time, Long spend,
                                             String app, String inst) {
        SpanView span = new SpanView();
        span.setId(UUID.randomUUID().toString().replace("-", ""));
        span.setGid(traceId);
        span.setPid(parentId);
        span.setTime(time);
        span.setSpend(spend);
        span.setApp(app);
        span.setInst(inst);
        span.setEnv("demo");
        span.setIp("127.0.0.1");
        span.setPort("8080");
        span.setError(false);
        return span;
    }
}
