package org.xi.lt.apm.service;

import com.alibaba.fastjson.JSON;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.TraceSpanRepository;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional
public class TraceSpanService {

    private static final Logger logger = LoggerFactory.getLogger(TraceSpanService.class);

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    @Autowired
    private ApplicationService applicationService;

    public void report(List<Map<String, Object>> spanList) {
        if (spanList == null || spanList.isEmpty()) {
            return;
        }

        logger.info("Received {} spans from agent", spanList.size());

        List<TraceSpan> spans = spanList.stream()
            .map(this::convertToEntity)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        traceSpanRepository.saveAll(spans);
        logger.info("Saved {} spans to database", spans.size());

        updateApplicationStatus(spans);
    }

    private TraceSpan convertToEntity(Map<String, Object> spanMap) {
        try {
            TraceSpan span = new TraceSpan();

            String traceId = getString(spanMap, "id");
            String spanType = getString(spanMap, "type");
            
            if ("hb".equals(spanType) || "jvm".equals(spanType)) {
                if (traceId == null || traceId.startsWith("unknown")) {
                    traceId = spanType + "-" + System.currentTimeMillis() + "-" + ThreadLocalRandom.current().nextLong(100000);
                }
            }
            
            span.setTraceId(traceId);
            span.setSpanType(spanType);
            span.setAppName(getString(spanMap, "app"));
            span.setEnv(getString(spanMap, "env"));
            span.setInstanceName(getString(spanMap, "inst"));
            span.setIpAddress(getString(spanMap, "ip"));
            span.setPort(getInt(spanMap, "port"));
            span.setProcessId(getString(spanMap, "pid"));
            span.setGroupId(getString(spanMap, "gid"));
            span.setDuration(getLong(spanMap, "spend"));

            Object timeObj = spanMap.get("time");
            if (timeObj instanceof Date) {
                span.setTimestamp(((Date) timeObj).toInstant().atOffset(ZoneOffset.of("+8")).toLocalDateTime());
            } else if (timeObj instanceof Long) {
                span.setTimestamp(LocalDateTime.ofEpochSecond(((Long) timeObj) / 1000, 0, ZoneOffset.of("+8")));
            } else if (timeObj instanceof String) {
                try {
                    span.setTimestamp(LocalDateTime.parse((String) timeObj));
                } catch (Exception e) {
                    span.setTimestamp(LocalDateTime.now());
                }
            } else {
                span.setTimestamp(LocalDateTime.now());
            }

            Object tagsObj = spanMap.get("tags");
            if (tagsObj instanceof Map) {
                Map<String, Object> tags = (Map<String, Object>) tagsObj;
                String tagsJson = JSON.toJSONString(tags);
                span.setTags(tagsJson);
                span.setTagMap(tags);
                
                span.setServiceName(getString(tags, "serviceName"));
                span.setMethodName(getString(tags, "methodName"));
                span.setParentId(getString(tags, "parentId"));
                span.setSuccess(getBoolean(tags, "success"));
                String errorMsg = getString(tags, "errorMsg");
                if (errorMsg != null && errorMsg.length() > 512) {
                    errorMsg = errorMsg.substring(0, 512);
                }
                span.setErrorMsg(errorMsg);
            }

            return span;
        } catch (Exception e) {
            logger.error("Failed to convert span map to entity", e);
            return null;
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private Integer getInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBoolean(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return true;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private void updateApplicationStatus(List<TraceSpan> spans) {
        Map<String, Set<String>> appInstances = new HashMap<>();

        for (TraceSpan span : spans) {
            if (span.getAppName() != null && span.getIpAddress() != null) {
                appInstances.computeIfAbsent(span.getAppName(), k -> new HashSet<>())
                    .add(span.getIpAddress() + ":" + span.getPort());
            }
        }

        for (Map.Entry<String, Set<String>> entry : appInstances.entrySet()) {
            String appName = entry.getKey();
            int instanceCount = entry.getValue().size();
            applicationService.updateInstanceCount(appName, instanceCount);
        }
    }

    public List<TraceSpan> findByTraceId(String traceId) {
        return traceSpanRepository.findByTraceId(traceId);
    }

    public List<TraceSpan> findByAppName(String appName) {
        return traceSpanRepository.findByAppName(appName);
    }

    public List<TraceSpan> findByAppNameAndTimeRange(String appName, LocalDateTime start, LocalDateTime end) {
        return traceSpanRepository.findByAppNameAndTimeRange(appName, start, end);
    }

    public Map<String, Object> getTraceStats(String appName, LocalDateTime since) {
        Map<String, Object> stats = new HashMap<>();

        Long count = traceSpanRepository.countByAppNameSince(appName, since);
        Double avgDuration = traceSpanRepository.avgDurationByAppNameSince(appName, since);

        stats.put("totalSpans", count);
        stats.put("avgDuration", avgDuration);
        stats.put("since", since);

        return stats;
    }

    public List<TraceSpan> findRecent(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return traceSpanRepository.findRecent(since);
    }

    public Map<String, Object> getGlobalStats(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);

        Map<String, Object> stats = new HashMap<>();

        Long totalTraces = traceSpanRepository.countSince(since);
        Long successCount = traceSpanRepository.countBySuccessSince(true, since);
        Long errorCount = traceSpanRepository.countBySuccessSince(false, since);
        Double avgDuration = traceSpanRepository.avgDurationSince(since);
        Long maxDuration = traceSpanRepository.maxDurationSince(since);
        Long minDuration = traceSpanRepository.minDurationSince(since);

        List<Map<String, Object>> topApps = new ArrayList<>();
        List<Object[]> appCounts = traceSpanRepository.countByAppNameSince(since);
        for (Object[] row : appCounts) {
            Map<String, Object> appStat = new HashMap<>();
            appStat.put("appName", row[0]);
            appStat.put("count", row[1]);
            topApps.add(appStat);
        }

        stats.put("totalTraces", totalTraces);
        stats.put("successCount", successCount);
        stats.put("errorCount", errorCount);
        stats.put("avgDuration", avgDuration);
        stats.put("maxDuration", maxDuration);
        stats.put("minDuration", minDuration);
        stats.put("topApps", topApps);

        return stats;
    }

    public List<String> findAllAppNames(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return traceSpanRepository.findDistinctAppNamesSince(since);
    }

    public void deleteAll() {
        traceSpanRepository.deleteAll();
        logger.info("All trace span data cleared");
    }
}
