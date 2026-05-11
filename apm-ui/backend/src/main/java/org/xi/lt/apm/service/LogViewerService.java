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
            // 如果没有真实数据，返回空列表，不使用mock
            return new ArrayList<>();
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
}
