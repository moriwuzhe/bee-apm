package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.LogEntryDTO;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.TraceSpanRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LogViewerService {

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    public List<LogEntryDTO> getLogs(String keyword, String level, String service) {
        List<LogEntryDTO> logs = new ArrayList<>();
        
        List<TraceSpan> spans = traceSpanRepository.findAll();
        if (!spans.isEmpty()) {
            int id = 1;
            for (TraceSpan span : spans) {
                String logLevel = span.getSuccess() ? "INFO" : "ERROR";
                
                String message = buildLogMessage(span);
                String exception = span.getErrorMsg();
                
                LogEntryDTO logEntry = new LogEntryDTO(
                    String.valueOf(id++),
                    formatTimestamp(span.getTimestamp()),
                    logLevel,
                    span.getAppName() != null ? span.getAppName() : "unknown",
                    "span-" + span.getId(),
                    message,
                    exception
                );
                
                logs.add(logEntry);
            }
        }

        if (logs.isEmpty()) {
            logs.addAll(getMockLogs());
        }

        return logs.stream()
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

    private String buildLogMessage(TraceSpan span) {
        StringBuilder sb = new StringBuilder();
        
        if (span.getSpanType() != null) {
            sb.append(span.getSpanType()).append(" ");
        }
        
        if (span.getServiceName() != null) {
            sb.append(span.getServiceName()).append(" ");
        }
        
        if (span.getMethodName() != null) {
            sb.append(span.getMethodName()).append(" ");
        }
        
        if (span.getDuration() != null) {
            sb.append("- ").append(span.getDuration()).append("ms");
        }
        
        if (!span.getSuccess() && span.getErrorMsg() != null) {
            sb.append(" - ERROR: ").append(span.getErrorMsg());
        }
        
        return sb.toString().trim();
    }

    private String formatTimestamp(LocalDateTime timestamp) {
        if (timestamp == null) {
            return LocalDateTime.now().format(FORMATTER);
        }
        return timestamp.format(FORMATTER);
    }

    private List<LogEntryDTO> getMockLogs() {
        return Arrays.asList(
            new LogEntryDTO("1", LocalDateTime.now().minusSeconds(5).format(FORMATTER), "ERROR", "order-service", "http-nio-8080-exec-1", "订单创建失败 - 库存不足", "com.example.OrderException: 库存不足\n\tat com.example.service.OrderService.createOrder(OrderService.java:145)"),
            new LogEntryDTO("2", LocalDateTime.now().minusSeconds(4).format(FORMATTER), "WARN", "inventory-service", "pool-2-thread-3", "库存扣减延迟超过500ms", null),
            new LogEntryDTO("3", LocalDateTime.now().minusSeconds(3).format(FORMATTER), "INFO", "payment-gateway", "http-nio-8081-exec-5", "支付成功 - orderId: O202401150001", null),
            new LogEntryDTO("4", LocalDateTime.now().minusSeconds(2).format(FORMATTER), "DEBUG", "user-service", "http-nio-8080-exec-2", "用户认证成功 - userId: U10086", null),
            new LogEntryDTO("5", LocalDateTime.now().minusSeconds(1).format(FORMATTER), "ERROR", "order-service", "http-nio-8080-exec-4", "数据库连接超时", "java.sql.SQLTimeoutException: Connection timeout"),
            new LogEntryDTO("6", LocalDateTime.now().format(FORMATTER), "WARN", "kafka-producer", "kafka-producer-network-thread", "消息发送重试 - topic: order-events", null),
            new LogEntryDTO("7", LocalDateTime.now().format(FORMATTER), "INFO", "notify-service", "pool-3-thread-1", "通知发送成功 - sms", null),
            new LogEntryDTO("8", LocalDateTime.now().format(FORMATTER), "DEBUG", "redis-cache", "lettuce-eventLoop-1", "缓存命中 - key: user:10086", null),
            new LogEntryDTO("9", LocalDateTime.now().format(FORMATTER), "INFO", "api-gateway", "http-nio-8080-exec-8", "请求完成 - /api/v1/orders - 156ms", null),
            new LogEntryDTO("10", LocalDateTime.now().format(FORMATTER), "ERROR", "search-service", "elasticsearch[node-1][search][T#1]", "搜索查询失败 - timeout", null)
        );
    }
}
