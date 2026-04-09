package org.xi.lt.server.web.diag.replay;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.xi.lt.common.utils.HttpUtils;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RequestReplayService {
    private RestClient restClient;
    private RestHighLevelClient es;

    @Value("${elasticsearch.host:127.0.0.1}")
    private String esHost;

    @Value("${elasticsearch.port:9200}")
    private int esPort;

    @Value("${elasticsearch.scheme:http}")
    private String esScheme;

    @Value("${replay.es.index.req:lt-request-*}")
    private String reqIndex;

    @Value("${replay.es.index.reqb:lt-request-body-*}")
    private String reqbIndex;

    @Value("${replay.es.index.reqh:lt-request-headers-*}")
    private String reqhIndex;

    @Value("${replay.es.index.rp:lt-request-param-*}")
    private String rpIndex;

    @PostConstruct
    public void init() {
        restClient = RestClient.builder(new HttpHost(esHost, esPort, esScheme)).build();
        es = new RestHighLevelClient(restClient);
    }

    @PreDestroy
    public void close() throws IOException {
        if (restClient != null) restClient.close();
    }

    public RequestSnapshot load(String requestId) {
        Map<String, Object> req = searchById(reqIndex, requestId);
        if (req == null) return null;
        Map<String, Object> reqb = searchById(reqbIndex, requestId);
        Map<String, Object> reqh = searchById(reqhIndex, requestId);
        Map<String, Object> rp = searchById(rpIndex, requestId);
        return RequestSnapshot.from(req, reqb, reqh, rp);
    }

    public ReplayResult replay(RequestSnapshot snapshot, String targetBaseUrl, boolean includeAuthHeaders, boolean includeCookieHeaders, int responseMaxChars) throws IOException {
        String base = trimSlash(targetBaseUrl);
        String path = snapshot.getUrl() == null ? "" : snapshot.getUrl().trim();
        if (!path.startsWith("/")) path = "/" + path;
        String fullUrl = base + path;
        String query = snapshot.buildQueryString();
        if (!query.isEmpty()) fullUrl = fullUrl + "?" + query;

        Map<String, String> headers = sanitizeHeaders(snapshot.getHeaders(), includeAuthHeaders, includeCookieHeaders);
        String method = snapshot.getMethod() == null ? "GET" : snapshot.getMethod().trim().toUpperCase();
        String bodyStr = snapshot.getBody() == null ? "" : snapshot.getBody();
        Request.Builder rb = new Request.Builder().url(fullUrl);
        rb.addHeader("X-APM-Replay-Traffic", "true");
        for (Map.Entry<String, String> e : headers.entrySet()) {
            if (e.getKey() == null || e.getKey().trim().isEmpty()) continue;
            if (e.getValue() == null) continue;
            rb.addHeader(e.getKey(), e.getValue());
        }

        Request req;
        if ("GET".equals(method) || "HEAD".equals(method)) {
            req = rb.method(method, null).build();
        } else {
            MediaType mt = null;
            String ct = findHeader(headers, "content-type");
            if (ct == null || ct.trim().isEmpty()) {
                if (!bodyStr.trim().isEmpty() && looksLikeJson(bodyStr)) {
                    ct = "application/json; charset=utf-8";
                } else {
                    ct = "text/plain; charset=utf-8";
                }
                rb.header("Content-Type", ct);
            }
            try {
                mt = MediaType.parse(ct);
            } catch (Exception ignored) {
            }
            RequestBody b = RequestBody.create(bodyStr, mt);
            req = rb.method(method, b).build();
        }

        try (Response resp = HttpUtils.getHttpClient().newCall(req).execute()) {
            String respBody = resp.body() == null ? "" : resp.body().string();
            if (responseMaxChars > 0 && respBody.length() > responseMaxChars) {
                respBody = respBody.substring(0, responseMaxChars) + "...";
            }
            return new ReplayResult(fullUrl, method, resp.code(), respBody);
        }
    }

    private Map<String, Object> searchById(String indexPattern, String requestId) {
        try {
            SearchRequest sr = new SearchRequest(indexPattern);
            SearchSourceBuilder ssb = new SearchSourceBuilder();
            BoolQueryBuilder bq = QueryBuilders.boolQuery()
                    .should(QueryBuilders.termQuery("id.keyword", requestId))
                    .should(QueryBuilders.termQuery("id", requestId))
                    .minimumShouldMatch(1);
            ssb.query(bq);
            ssb.size(1);
            sr.source(ssb);
            SearchResponse resp = es.search(sr);
            if (resp.getHits() == null || resp.getHits().getHits() == null || resp.getHits().getHits().length == 0) return null;
            SearchHit hit = resp.getHits().getHits()[0];
            return hit.getSourceAsMap();
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, String> sanitizeHeaders(Map<String, String> headers, boolean includeAuthHeaders, boolean includeCookieHeaders) {
        if (headers == null || headers.isEmpty()) return Collections.emptyMap();
        Map<String, String> out = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : headers.entrySet()) {
            String k = e.getKey();
            if (k == null) continue;
            String kl = k.trim().toLowerCase();
            if (kl.isEmpty()) continue;
            if ("host".equals(kl)) continue;
            if ("content-length".equals(kl)) continue;
            if ("connection".equals(kl)) continue;
            if ("accept-encoding".equals(kl)) continue;
            if (!includeAuthHeaders && "authorization".equals(kl)) continue;
            if (!includeCookieHeaders && "cookie".equals(kl)) continue;
            String v = e.getValue();
            if (v == null) continue;
            out.put(k, v);
        }
        return out;
    }

    private static String findHeader(Map<String, String> headers, String keyLower) {
        if (headers == null || headers.isEmpty()) return null;
        for (Map.Entry<String, String> e : headers.entrySet()) {
            if (e.getKey() == null) continue;
            if (e.getKey().trim().toLowerCase().equals(keyLower)) return e.getValue();
        }
        return null;
    }

    private static boolean looksLikeJson(String s) {
        if (s == null) return false;
        String x = s.trim();
        return x.startsWith("{") || x.startsWith("[");
    }

    private static String trimSlash(String base) {
        if (base == null) return "";
        String x = base.trim();
        while (x.endsWith("/")) x = x.substring(0, x.length() - 1);
        return x;
    }

    public static final class RequestSnapshot {
        private String id;
        private String url;
        private String method;
        private String ip;
        private String port;
        private String body;
        private Map<String, String> headers = new LinkedHashMap<>();
        private Map<String, Object> params = new LinkedHashMap<>();

        public RequestSnapshot() {
        }

        static RequestSnapshot from(Map<String, Object> req, Map<String, Object> reqb, Map<String, Object> reqh, Map<String, Object> rp) {
            RequestSnapshot s = new RequestSnapshot();
            s.id = str(req.get("id"));
            s.ip = str(req.get("ip"));
            s.port = str(req.get("port"));
            Map<String, Object> tags = map(req.get("tags"));
            s.url = str(tags.get("url"));
            s.method = str(tags.get("method"));
            if (reqb != null) {
                Map<String, Object> t = map(reqb.get("tags"));
                s.body = str(t.get("body"));
            }
            if (reqh != null) {
                Map<String, Object> t = map(reqh.get("tags"));
                String hs = str(t.get("headers"));
                s.headers = parseStringMap(hs);
            }
            if (rp != null) {
                Map<String, Object> t = map(rp.get("tags"));
                String ps = str(t.get("param"));
                s.params = parseJson(ps);
            }
            return s;
        }

        public String buildQueryString() {
            if (params == null || params.isEmpty()) return "";
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Object> e : params.entrySet()) {
                String k = e.getKey();
                if (k == null || k.trim().isEmpty()) continue;
                Object v = e.getValue();
                if (v == null) {
                    appendQuery(sb, k, "");
                    continue;
                }
                if (v instanceof Iterable) {
                    for (Object it : (Iterable<?>) v) {
                        appendQuery(sb, k, it == null ? "" : String.valueOf(it));
                    }
                    continue;
                }
                if (v.getClass().isArray()) {
                    Object[] arr = (Object[]) v;
                    for (Object it : arr) {
                        appendQuery(sb, k, it == null ? "" : String.valueOf(it));
                    }
                    continue;
                }
                appendQuery(sb, k, String.valueOf(v));
            }
            return sb.toString();
        }

        private static void appendQuery(StringBuilder sb, String k, String v) {
            if (sb.length() > 0) sb.append('&');
            sb.append(urlEncode(k)).append('=').append(urlEncode(v));
        }

        private static String urlEncode(String s) {
            if (s == null) return "";
            try {
                return URLEncoder.encode(s, "UTF-8");
            } catch (Exception ignored) {
                return s;
            }
        }

        private static Map<String, String> parseStringMap(String json) {
            if (json == null || json.trim().isEmpty()) return new LinkedHashMap<>();
            try {
                JSONObject o = JSON.parseObject(json);
                Map<String, String> out = new LinkedHashMap<>();
                for (String k : o.keySet()) {
                    Object v = o.get(k);
                    out.put(k, v == null ? "" : String.valueOf(v));
                }
                return out;
            } catch (Exception ignored) {
                return new LinkedHashMap<>();
            }
        }

        private static Map<String, Object> parseJson(String json) {
            if (json == null || json.trim().isEmpty()) return new LinkedHashMap<>();
            try {
                return JSON.parseObject(json, Map.class);
            } catch (Exception ignored) {
                return new LinkedHashMap<>();
            }
        }

        private static Map<String, Object> map(Object o) {
            if (o instanceof Map) return (Map<String, Object>) o;
            return new LinkedHashMap<>();
        }

        private static String str(Object o) {
            return o == null ? "" : String.valueOf(o);
        }

        public String getId() {
            return id;
        }

        public String getUrl() {
            return url;
        }

        public String getMethod() {
            return method;
        }

        public String getIp() {
            return ip;
        }

        public String getPort() {
            return port;
        }

        public String getBody() {
            return body;
        }

        public Map<String, String> getHeaders() {
            return headers;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public void setIp(String ip) {
            this.ip = ip;
        }

        public void setPort(String port) {
            this.port = port;
        }

        public void setBody(String body) {
            this.body = body;
        }

        public void setHeaders(Map<String, String> headers) {
            this.headers = headers == null ? new LinkedHashMap<>() : headers;
        }

        public void setParams(Map<String, Object> params) {
            this.params = params == null ? new LinkedHashMap<>() : params;
        }
    }

    public static final class ReplayResult {
        private final String url;
        private final String method;
        private final int status;
        private final String body;

        public ReplayResult(String url, String method, int status, String body) {
            this.url = url;
            this.method = method;
            this.status = status;
            this.body = body;
        }

        public String getUrl() {
            return url;
        }

        public String getMethod() {
            return method;
        }

        public int getStatus() {
            return status;
        }

        public String getBody() {
            return body;
        }
    }
}
