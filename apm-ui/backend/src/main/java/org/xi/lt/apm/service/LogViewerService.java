package org.xi.lt.apm.service;

import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.LogEntryDTO;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LogViewerService {

    public List<LogEntryDTO> getLogs(String keyword, String level, String service) {
        List<LogEntryDTO> allLogs = Arrays.asList(
            new LogEntryDTO("1", "2024-01-15 14:32:15.123", "ERROR", "order-service", "http-nio-8080-exec-1", "订单创建失败 - 库存不足", "com.example.OrderException: 库存不足\n\tat com.example.service.OrderService.createOrder(OrderService.java:145)\n\tat com.example.controller.OrderController.create(OrderController.java:67)"),
            new LogEntryDTO("2", "2024-01-15 14:32:15.456", "WARN", "inventory-service", "pool-2-thread-3", "库存扣减延迟超过500ms", null),
            new LogEntryDTO("3", "2024-01-15 14:32:16.789", "INFO", "payment-gateway", "http-nio-8081-exec-5", "支付成功 - orderId: O202401150001", null),
            new LogEntryDTO("4", "2024-01-15 14:32:17.012", "DEBUG", "user-service", "http-nio-8080-exec-2", "用户认证成功 - userId: U10086", null),
            new LogEntryDTO("5", "2024-01-15 14:32:18.345", "ERROR", "order-service", "http-nio-8080-exec-4", "数据库连接超时", "java.sql.SQLTimeoutException: Connection timeout\n\tat com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:129)"),
            new LogEntryDTO("6", "2024-01-15 14:32:19.678", "WARN", "kafka-producer", "kafka-producer-network-thread", "消息发送重试 - topic: order-events", null),
            new LogEntryDTO("7", "2024-01-15 14:32:20.901", "INFO", "notify-service", "pool-3-thread-1", "通知发送成功 - sms", null),
            new LogEntryDTO("8", "2024-01-15 14:32:21.234", "DEBUG", "redis-cache", "lettuce-eventLoop-1", "缓存命中 - key: user:10086", null),
            new LogEntryDTO("9", "2024-01-15 14:32:22.567", "INFO", "api-gateway", "http-nio-8080-exec-8", "请求完成 - /api/v1/orders - 156ms", null),
            new LogEntryDTO("10", "2024-01-15 14:32:23.890", "ERROR", "search-service", "elasticsearch[node-1][search][T#1]", "搜索查询失败 - timeout", null)
        );

        return allLogs.stream()
            .filter(log -> {
                boolean matchesKeyword = keyword == null || keyword.isEmpty() ||
                    log.getMessage().toLowerCase().contains(keyword.toLowerCase()) ||
                    log.getService().toLowerCase().contains(keyword.toLowerCase()) ||
                    log.getThread().toLowerCase().contains(keyword.toLowerCase());
                boolean matchesLevel = level == null || level.isEmpty() || "all".equals(level) || log.getLevel().equals(level);
                boolean matchesService = service == null || service.isEmpty() || "all".equals(service) || log.getService().equals(service);
                return matchesKeyword && matchesLevel && matchesService;
            })
            .collect(Collectors.toList());
    }
}