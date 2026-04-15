package org.xi.lt.server.web.interfaces.http.apm;

import org.elasticsearch.client.RestHighLevelClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.web.service.TailBasedSamplingService;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * APM数据上报接口
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
@RestController
@RequestMapping("/apm")
public class ApmReportController {

    private static final Logger log = LoggerFactory.getLogger(ApmReportController.class);
    private static final String INDEX_NAME = "lt_apm_span";

    @Autowired
    private TailBasedSamplingService samplingService;

    @Autowired(required = false)
    private RestHighLevelClient restHighLevelClient;

    @Value("${apm.es.enabled:true}")
    private boolean esEnabled;

    /**
     * 接收Agent上报的Span数据
     * @param payload Span列表或单条Span
     * @return 上报结果
     */
    @PostMapping("/report")
    public String report(@RequestBody Object payload) {
        if (!esEnabled || restHighLevelClient == null) {
            return "disabled";
        }

        List<Object> spanList = toSpanList(payload);
        if (spanList.isEmpty()) {
            return "success";
        }

        try {
            java.util.HashMap groupedSpans = new java.util.HashMap();
            for (Object raw : spanList) {
                Object doc = normalizeSpanDoc(raw);
                String gid = asString(get(doc, "gid"));
                java.util.List list = (java.util.List) groupedSpans.get(gid);
                if (list == null) {
                    list = new java.util.ArrayList();
                    groupedSpans.put(gid, list);
                }
                list.add(doc);
            }

            for (Object e : groupedSpans.entrySet()) {
                java.util.Map.Entry entry = (java.util.Map.Entry) e;
                samplingService.addSpans(String.valueOf(entry.getKey()), (List<?>) entry.getValue());
            }
            return "success";
        } catch (Exception e) {
            log.error("Span数据放入尾部采样缓冲区失败", e);
            return "error";
        }
    }

    /**
     * 兼容老字段与 agent span 字段，统一写入 lt_apm_span 的字段模型
     */
    private static Object normalizeSpanDoc(Object raw) {
        java.util.Map src = raw instanceof java.util.Map ? (java.util.Map) raw : new java.util.HashMap();
        java.util.HashMap doc = new java.util.HashMap(src);

        Object timeObj = doc.get("time");
        if (timeObj == null) timeObj = doc.get("startTime");
        long time = parseTimeMillis(timeObj);
        if (time > 0) {
            doc.put("time", time);
        }

        if (!doc.containsKey("gid")) {
            Object v = doc.get("traceId");
            if (v != null) doc.put("gid", v);
        }
        if (!doc.containsKey("pid")) {
            Object v = doc.get("parentSpanId");
            if (v != null) doc.put("pid", v);
        }
        if (!doc.containsKey("id")) {
            Object v = doc.get("spanId");
            if (v != null) doc.put("id", v);
        }

        if (!doc.containsKey("app")) {
            Object v = doc.get("appId");
            if (v != null) doc.put("app", v);
        }
        if (!doc.containsKey("inst")) {
            Object v = doc.get("instanceId");
            if (v != null) doc.put("inst", v);
        }
        if (!doc.containsKey("env")) {
            Object v = doc.get("environment");
            if (v != null) doc.put("env", v);
        }
        if (!doc.containsKey("ip")) {
            Object v = doc.get("host");
            if (v != null) doc.put("ip", v);
        }

        Object tagsObj = doc.get("tags");
        if (tagsObj instanceof java.util.Map) {
            return doc;
        }
        if (tagsObj == null) {
            doc.put("tags", new java.util.HashMap());
        }
        return doc;
    }

    private static List<Object> toSpanList(Object payload) {
        List<Object> out = new ArrayList<>();
        if (payload instanceof List) {
            List list = (List) payload;
            for (Object o : list) {
                if (o instanceof java.util.Map) {
                    out.add(o);
                }
            }
            return out;
        }
        if (payload instanceof java.util.Map) {
            out.add(payload);
        }
        return out;
    }

    private static Object get(Object obj, String key) {
        if (obj == null || key == null) return null;
        if (obj instanceof java.util.Map) {
            return ((java.util.Map) obj).get(key);
        }
        return null;
    }

    private static String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static long toLong(Object o, long def) {
        if (o == null) return def;
        if (o instanceof Number) return ((Number) o).longValue();
        try {
            return Long.parseLong(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }

    private static long parseTimeMillis(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).longValue();
        if (o instanceof Date) return ((Date) o).getTime();
        String s = String.valueOf(o).trim();
        if (s.isEmpty()) return 0;

        try {
            return Instant.parse(s).toEpochMilli();
        } catch (DateTimeParseException ignored) {
        }

        DateTimeFormatter[] fmts = new DateTimeFormatter[]{
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        };
        for (DateTimeFormatter fmt : fmts) {
            try {
                LocalDateTime ldt = LocalDateTime.parse(s, fmt);
                return ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            } catch (DateTimeParseException ignored) {
            }
        }

        return toLong(o, 0);
    }
}
