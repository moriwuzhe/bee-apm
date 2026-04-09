package org.xi.lt.server.web.diag.netty;

import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.web.diag.remoting.protocol.Datagram;
import org.xi.lt.server.web.diag.remoting.protocol.RemotingBuilder;
import org.xi.lt.server.web.diag.remoting.protocol.payload.RawStringPayloadHolder;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class AgentCommandService {
    private static final int CODE_COMMAND = 1000;
    private static final int CODE_COMMAND_RESPONSE = 1001;

    @Autowired
    private AgentConnectionStore store;

    private final ConcurrentHashMap<String, CompletableFuture<String>> pending = new ConcurrentHashMap<>();

    public String threadDump(String agentId, long timeoutMs) {
        return exec(agentId, "threadDump", timeoutMs);
    }

    public String jvmInfo(String agentId, long timeoutMs) {
        return exec(agentId, "jvmInfo", timeoutMs);
    }

    public String gc(String agentId, long timeoutMs) {
        return exec(agentId, "gc", timeoutMs);
    }

    public String sysProps(String agentId, long timeoutMs) {
        return exec(agentId, "sysProps", timeoutMs);
    }

    public String env(String agentId, long timeoutMs) {
        return exec(agentId, "env", timeoutMs);
    }

    public String inputArgs(String agentId, long timeoutMs) {
        return exec(agentId, "inputArgs", timeoutMs);
    }

    public String classLoading(String agentId, long timeoutMs) {
        return exec(agentId, "classLoading", timeoutMs);
    }

    public String memory(String agentId, long timeoutMs) {
        return exec(agentId, "memory", timeoutMs);
    }

    public String gcStats(String agentId, long timeoutMs) {
        return exec(agentId, "gcStats", timeoutMs);
    }

    public String threadsSummary(String agentId, long timeoutMs) {
        return exec(agentId, "threadsSummary", timeoutMs);
    }

    public String deadlocks(String agentId, long timeoutMs) {
        return exec(agentId, "deadlocks", timeoutMs);
    }

    public String topThreadsCpu(String agentId, int limit, boolean runnableOnly, long timeoutMs) {
        int n = limit;
        if (n < 1) n = 1;
        if (n > 50) n = 50;
        return exec(agentId, "topThreadsCpu:" + n + (runnableOnly ? ":runnable" : ""), timeoutMs);
    }

    public String jdwpEnable(String agentId, int port, long timeoutMs) {
        int p = port;
        if (p < 1) p = 1;
        if (p > 65535) p = 65535;
        return exec(agentId, "jdwpEnable:" + p, timeoutMs);
    }

    public String jdwpStatus(String agentId, int port, long timeoutMs) {
        int p = port;
        if (p < 1) p = 1;
        if (p > 65535) p = 65535;
        return exec(agentId, "jdwpStatus:" + p, timeoutMs);
    }

    public String watchAdd(String agentId, String className, String methodName, int limit, long timeoutMs) {
        int n = limit;
        if (n < 1) n = 1;
        if (n > 500) n = 500;
        return exec(agentId, "watchAdd:" + className + ":" + methodName + ":" + n, timeoutMs);
    }

    public String watchAdd(String agentId, String className, String methodName, String paramTypes, int limit, long timeoutMs) {
        int n = limit;
        if (n < 1) n = 1;
        if (n > 500) n = 500;
        String c = urlEncode(className);
        String m = urlEncode(methodName);
        String p = urlEncode(paramTypes == null ? "" : paramTypes);
        return exec(agentId, "watchAdd:" + c + ":" + m + ":" + n + ":" + p, timeoutMs);
    }

    public String watchDump(String agentId, String id, int maxLines, long timeoutMs) {
        int n = maxLines;
        if (n < 1) n = 1;
        if (n > 2000) n = 2000;
        return exec(agentId, "watchDump:" + id + ":" + n, timeoutMs);
    }

    public String watchClear(String agentId, String id, long timeoutMs) {
        return exec(agentId, "watchClear:" + id, timeoutMs);
    }

    public String watchList(String agentId, long timeoutMs) {
        return exec(agentId, "watchList", timeoutMs);
    }

    public String debugAdd(String agentId, String className, String methodName, String when, String paramTypes, int limit, int stackDepth, String contains, long timeoutMs) {
        int n = limit;
        if (n < 1) n = 1;
        if (n > 500) n = 500;
        int sd = stackDepth;
        if (sd < 0) sd = 0;
        if (sd > 60) sd = 60;
        String c = urlEncode(className);
        String m = urlEncode(methodName);
        String w = urlEncode(when);
        String f = urlEncode(contains == null ? "" : contains);
        String p = urlEncode(paramTypes == null ? "" : paramTypes);
        return exec(agentId, "debugAdd:" + c + ":" + m + ":" + w + ":" + n + ":" + sd + ":" + f + ":" + p, timeoutMs);
    }

    public String debugDump(String agentId, String id, int maxLines, long timeoutMs) {
        int n = maxLines;
        if (n < 1) n = 1;
        if (n > 2000) n = 2000;
        String d = urlEncode(id);
        return exec(agentId, "debugDump:" + d + ":" + n, timeoutMs);
    }

    public String debugClear(String agentId, String id, long timeoutMs) {
        String d = urlEncode(id);
        return exec(agentId, "debugClear:" + d, timeoutMs);
    }

    public String debugList(String agentId, long timeoutMs) {
        return exec(agentId, "debugList", timeoutMs);
    }

    public String startProfiler(String agentId, String event, int duration, long timeoutMs) {
        String cmd = "startProfiler:" + encode(event) + ":" + duration;
        return exec(agentId, cmd, timeoutMs);
    }

    public String stopProfiler(String agentId, long timeoutMs) {
        return exec(agentId, "stopProfiler", timeoutMs);
    }

    private String exec(String agentId, String cmd, long timeoutMs) {
        AgentConnection conn = store.get(agentId);
        if (conn == null || !conn.isActive() || !conn.isWritable()) {
            throw new IllegalStateException("Agent not connected: " + agentId);
        }
        Channel ch = conn.getChannel();
        String id = UUID.randomUUID().toString();
        CompletableFuture<String> future = new CompletableFuture<>();
        pending.put(id, future);
        ch.eventLoop().schedule(() -> {
            CompletableFuture<String> f = pending.remove(id);
            if (f != null) {
                f.completeExceptionally(new RuntimeException("Timeout"));
            }
        }, timeoutMs, TimeUnit.MILLISECONDS);

        Datagram req = RemotingBuilder.buildRequestDatagram(CODE_COMMAND, id, new RawStringPayloadHolder(cmd));
        ch.writeAndFlush(req);
        try {
            return future.get(timeoutMs + 500, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            pending.remove(id);
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    public void onDatagram(Datagram msg) {
        if (msg == null || msg.getHeader() == null) return;
        if (msg.getHeader().getCode() != CODE_COMMAND_RESPONSE) return;
        String id = msg.getHeader().getId();
        if (id == null || id.isEmpty()) return;
        CompletableFuture<String> f = pending.remove(id);
        if (f == null) return;
        String payload = readBodyString(msg.getBody());
        f.complete(payload);
    }

    private String readBodyString(ByteBuf body) {
        if (body == null || !body.isReadable()) return "";
        return body.toString(StandardCharsets.UTF_8);
    }

    private static String urlEncode(String s) {
        private String encode(String s) {
        if (s == null) return "";
        try {
            return URLEncoder.encode(s, "UTF-8");
        } catch (Exception ignored) {
            return s;
        }
    }
}
