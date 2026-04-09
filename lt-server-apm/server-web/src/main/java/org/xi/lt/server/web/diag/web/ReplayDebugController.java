package org.xi.lt.server.web.diag.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.diag.netty.AgentCommandService;
import org.xi.lt.server.web.diag.replay.RequestReplayService;
import org.xi.lt.server.web.diag.replay.RequestReplayService.ReplayResult;
import org.xi.lt.server.web.diag.replay.RequestReplayService.RequestSnapshot;

@RestController
public class ReplayDebugController {
    @Autowired
    private RequestReplayService replayService;

    @Autowired
    private AgentCommandService commandService;

    @PostMapping("/diag/replay/debugOnce")
    public ApiResult<String> debugOnce(@RequestBody ReplayDebugRequest req) {
        try {
            if (req == null) return ApiResult.fail("EmptyRequest");
            if (req.agentId == null || req.agentId.trim().isEmpty()) return ApiResult.fail("AgentIdRequired");
            if (req.className == null || req.className.trim().isEmpty()) return ApiResult.fail("ClassNameRequired");
            if (req.methodName == null || req.methodName.trim().isEmpty()) return ApiResult.fail("MethodNameRequired");
            if (req.when == null || req.when.trim().isEmpty()) return ApiResult.fail("WhenRequired");

            RequestSnapshot snap;
            if (req.snapshot != null) {
                snap = req.snapshot.toSnapshot();
            } else {
                if (req.requestId == null || req.requestId.trim().isEmpty()) return ApiResult.fail("RequestIdRequired");
                snap = replayService.load(req.requestId.trim());
                if (snap == null) return ApiResult.fail("RequestNotFound id=" + req.requestId);
            }

            String baseUrl = req.targetBaseUrl;
            if (baseUrl == null || baseUrl.trim().isEmpty()) {
                return ApiResult.fail("TargetBaseUrlRequired: For safety, please explicitly select a target node to replay the traffic to avoid affecting production data.");
            }

            int limit = req.limit == null ? 20 : req.limit;
            int stackDepth = req.stackDepth == null ? 0 : req.stackDepth;
            int dumpLines = req.dumpLines == null ? 200 : req.dumpLines;
            int waitMs = req.waitMs == null ? 3000 : req.waitMs;
            int responseMaxChars = req.responseMaxChars == null ? 4000 : req.responseMaxChars;

            String debugAdd = commandService.debugAdd(req.agentId.trim(), req.className.trim(), req.methodName.trim(), req.when.trim(), req.paramTypes, limit, stackDepth, req.contains, 8000);
            String debugId = parseId(debugAdd);
            if (debugId == null || debugId.isEmpty()) {
                return ApiResult.fail("DebugAddFailed: " + firstLine(debugAdd));
            }

            ReplayResult replayRes;
            if (req.dryRun != null && req.dryRun) {
                replayRes = new ReplayResult(baseUrl + (snap.getUrl() == null ? "" : snap.getUrl()), snap.getMethod(), -1, "");
            } else {
                replayRes = replayService.replay(snap, baseUrl, truthy(req.includeAuthHeaders), truthy(req.includeCookieHeaders), responseMaxChars);
            }

            String dump = waitForDump(req.agentId.trim(), debugId, dumpLines, waitMs);
            if (truthy(req.lastEventOnly)) {
                dump = keepLastEventOnly(dump);
            }
            if (truthy(req.clearAfter)) {
                try {
                    commandService.debugClear(req.agentId.trim(), debugId, 8000);
                } catch (Exception ignored) {
                }
            }

            StringBuilder sb = new StringBuilder();
            sb.append("debugAdd:\n").append(debugAdd).append('\n');
            sb.append("replay:\n");
            sb.append("url=").append(replayRes.getUrl()).append('\n');
            sb.append("method=").append(replayRes.getMethod()).append('\n');
            sb.append("status=").append(replayRes.getStatus()).append('\n');
            if (replayRes.getBody() != null && !replayRes.getBody().isEmpty()) {
                sb.append("body=").append(replayRes.getBody()).append('\n');
            }
            sb.append('\n');
            sb.append("debugDump:\n").append(dump);
            return ApiResult.ok(sb.toString());
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    private String waitForDump(String agentId, String debugId, int dumpLines, int waitMs) throws InterruptedException {
        long end = System.currentTimeMillis() + Math.max(100, waitMs);
        String last = commandService.debugDump(agentId, debugId, dumpLines, 8000);
        int events = parseEvents(last);
        if (events > 0) return last;
        while (System.currentTimeMillis() < end) {
            Thread.sleep(200);
            last = commandService.debugDump(agentId, debugId, dumpLines, 8000);
            events = parseEvents(last);
            if (events > 0) break;
        }
        return last;
    }

    private static int parseEvents(String dump) {
        if (dump == null) return 0;
        int idx = dump.indexOf("\nevents=");
        if (idx < 0) idx = dump.indexOf("events=");
        if (idx < 0) return 0;
        int start = dump.indexOf("events=", idx);
        if (start < 0) return 0;
        start += "events=".length();
        int end = dump.indexOf('\n', start);
        if (end < 0) end = dump.length();
        String n = dump.substring(start, end).trim();
        try {
            return Integer.parseInt(n);
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static String parseId(String s) {
        if (s == null) return "";
        int i = s.indexOf("id=");
        if (i < 0) return "";
        i += 3;
        int j = i;
        while (j < s.length()) {
            char c = s.charAt(j);
            if (Character.isLetterOrDigit(c)) {
                j++;
                continue;
            }
            break;
        }
        return s.substring(i, j);
    }

    private static boolean truthy(Boolean b) {
        return b != null && b;
    }

    private static String firstLine(String s) {
        if (s == null) return "";
        int i = s.indexOf('\n');
        return i < 0 ? s : s.substring(0, i);
    }

    public static final class ReplayDebugRequest {
        public String agentId;
        public String requestId;
        public String targetBaseUrl;
        public String className;
        public String methodName;
        public String when;
        public String paramTypes;
        public Integer limit;
        public Integer stackDepth;
        public String contains;
        public Integer dumpLines;
        public Integer waitMs;
        public Boolean clearAfter;
        public Boolean includeAuthHeaders;
        public Boolean includeCookieHeaders;
        public Integer responseMaxChars;
        public Boolean dryRun;
        public Boolean lastEventOnly;
        public Snapshot snapshot;
    }

    public static final class Snapshot {
        public String url;
        public String method;
        public String ip;
        public String port;
        public String body;
        public java.util.Map<String, String> headers;
        public java.util.Map<String, Object> params;

        RequestSnapshot toSnapshot() {
            RequestSnapshot s = new RequestSnapshot();
            s.setUrl(url);
            s.setMethod(method);
            s.setIp(ip);
            s.setPort(port);
            s.setBody(body);
            s.setHeaders(headers);
            s.setParams(params);
            return s;
        }
    }

    private static String keepLastEventOnly(String dump) {
        if (dump == null || dump.isEmpty()) return dump;
        int eventsLineIdx = dump.indexOf("\nevents=");
        if (eventsLineIdx < 0) eventsLineIdx = dump.indexOf("events=");
        int headerEnd = -1;
        if (eventsLineIdx >= 0) {
            int afterEventsLine = dump.indexOf('\n', eventsLineIdx + 1);
            if (afterEventsLine >= 0) {
                headerEnd = dump.indexOf("\n\n", afterEventsLine);
            }
        } else {
            headerEnd = dump.indexOf("\n\n");
        }
        if (headerEnd < 0) return dump;

        String header = dump.substring(0, headerEnd + 2);
        String body = dump.substring(headerEnd + 2);
        int idx = lastEventIndex(body);
        if (idx < 0) return dump;
        return header + body.substring(idx);
    }

    private static int lastEventIndex(String s) {
        if (s == null || s.isEmpty()) return -1;
        int a = lastIndexLine(s, "ENTER ");
        int b = lastIndexLine(s, "EXIT ");
        int c = lastIndexLine(s, "THROW ");
        int m = Math.max(a, Math.max(b, c));
        return m;
    }

    private static int lastIndexLine(String s, String prefix) {
        int i = s.lastIndexOf("\n" + prefix);
        if (i >= 0) return i + 1;
        if (s.startsWith(prefix)) return 0;
        return -1;
    }
}
