package org.xi.lt.agent.boot;

import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.ByteToMessageDecoder;
import io.netty.handler.codec.MessageToByteEncoder;
import io.netty.util.concurrent.ScheduledFuture;
import org.xi.lt.agent.common.LtUtils;
import org.xi.lt.agent.config.ConfigUtils;
import org.xi.lt.agent.log.LogUtil;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryUsage;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class DiagAgentClient {
    private static final int MAGIC = 0xdec10ade;
    private static final short PROTOCOL_VERSION = 1;
    private static final short AGENT_VERSION = 12;
    private static final int HEARTBEAT_CODE = 0;
    private static final int COMMAND_CODE = 1000;
    private static final int COMMAND_RESPONSE_CODE = 1001;

    private final String host;
    private final int port;
    private final int heartbeatSec;
    private final String agentId;

    private final EventLoopGroup group = new NioEventLoopGroup(1);
    private volatile Channel channel;

    public static DiagAgentClient tryCreate() {
        String host = System.getProperty("diag.proxy.host", ConfigUtils.me().getStr("diag.proxy.host"));
        if (LtUtils.isBlank(host)) {
            host = System.getProperty("bistoury.proxy.host", ConfigUtils.me().getStr("bistoury.proxy.host"));
        }
        if (LtUtils.isBlank(host)) {
            return null;
        }
        int port = ConfigUtils.me().getInt("diag.proxy.port", -1);
        String portStr = System.getProperty("diag.proxy.port");
        if (LtUtils.isBlank(portStr) && port <= 0) {
            port = ConfigUtils.me().getInt("bistoury.proxy.port", 3333);
            portStr = System.getProperty("bistoury.proxy.port");
        }
        if (!LtUtils.isBlank(portStr)) {
            port = Integer.parseInt(portStr);
        }
        int heartbeat = ConfigUtils.me().getInt("diag.proxy.heartbeat", -1);
        String heartbeatStr = System.getProperty("diag.proxy.heartbeat");
        if (LtUtils.isBlank(heartbeatStr) && heartbeat <= 0) {
            heartbeat = ConfigUtils.me().getInt("bistoury.proxy.heartbeat", 30);
            heartbeatStr = System.getProperty("bistoury.proxy.heartbeat");
        }
        if (!LtUtils.isBlank(heartbeatStr)) {
            heartbeat = Integer.parseInt(heartbeatStr);
        }
        return new DiagAgentClient(host, port, heartbeat, buildAgentId());
    }

    private static String buildAgentId() {
        String ip = System.getProperty("lt.ip");
        String port = System.getProperty("lt.port");
        String app = System.getProperty("lt.app");
        String env = System.getProperty("lt.env");
        String inst = System.getProperty("lt.inst");
        StringBuilder sb = new StringBuilder();
        if (!LtUtils.isBlank(app)) sb.append(app);
        if (!LtUtils.isBlank(env)) sb.append("@").append(env);
        if (!LtUtils.isBlank(inst)) sb.append("@").append(inst);
        if (!LtUtils.isBlank(ip) || !LtUtils.isBlank(port)) sb.append("@").append(ip == null ? "" : ip).append(":").append(port == null ? "" : port);
        if (sb.length() == 0) {
            sb.append("agent@").append(UUID.randomUUID().toString().replace("-", ""));
        }
        return sb.toString();
    }

    private DiagAgentClient(String host, int port, int heartbeatSec, String agentId) {
        this.host = host;
        this.port = port;
        this.heartbeatSec = Math.max(5, heartbeatSec);
        this.agentId = agentId;
    }

    public void start() {
        Bootstrap bootstrap = new Bootstrap();
        bootstrap.group(group)
                .channel(NioSocketChannel.class)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000)
                .option(ChannelOption.TCP_NODELAY, true)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        ch.pipeline().addLast(new Decoder());
                        ch.pipeline().addLast(new Encoder());
                        ch.pipeline().addLast(new Handler(bootstrap));
                    }
                });

        connect(bootstrap);
        LogUtil.log("diag agent enabled, host=" + host + ", port=" + port + ", agentId=" + agentId);
    }

    public void stop() {
        try {
            if (channel != null) {
                channel.close();
            }
        } catch (Throwable ignored) {
        }
        group.shutdownGracefully();
    }

    private void connect(Bootstrap bootstrap) {
        bootstrap.connect(host, port).addListener((ChannelFutureListener) future -> {
            if (!future.isSuccess()) {
                scheduleReconnect(bootstrap);
            }
        });
    }

    private void scheduleReconnect(Bootstrap bootstrap) {
        group.schedule(() -> connect(bootstrap), 5, TimeUnit.SECONDS);
    }

    private void sendHeartbeat(Channel ch) {
        if (ch == null || !ch.isActive()) return;
        Datagram d = new Datagram();
        d.header = new Header();
        d.header.id = UUID.randomUUID().toString();
        d.header.code = HEARTBEAT_CODE;
        d.header.flag = 0;
        d.header.agentVersion = AGENT_VERSION;
        
        // 添加 project 和 secret 用于服务端鉴权
        String project = System.getProperty("lt.project", ConfigUtils.me().getStr("projectCode", "default"));
        String secret = System.getProperty("lt.secret", ConfigUtils.me().getStr("secretKey", ""));
        d.header.properties = new java.util.HashMap<>();
        d.header.properties.put("lt.project", project);
        d.header.properties.put("lt.secret", secret);
        
        d.body = agentId;
        ch.writeAndFlush(d);
    }

    private static void writeString(String data, ByteBuf out) {
        if (data == null || data.isEmpty()) {
            out.writeShort(0);
            return;
        }
        byte[] bs = data.getBytes(StandardCharsets.UTF_8);
        out.writeShort((short) bs.length);
        out.writeBytes(bs);
    }

    private static class Header {
        String id;
        int code;
        int flag;
        short agentVersion;
        java.util.Map<String, Object> properties;
    }

    private static class Datagram {
        Header header;
        String body;
    }

    private static class Encoder extends MessageToByteEncoder<Datagram> {
        @Override
        protected void encode(ChannelHandlerContext ctx, Datagram msg, ByteBuf out) {
            int start = out.writerIndex();
            out.writeInt(0);
            out.writeShort(0);
            int headerStart = out.writerIndex();

            out.writeInt(MAGIC);
            out.writeShort(PROTOCOL_VERSION);
            out.writeShort(msg.header.agentVersion);
            writeString(msg.header.id == null ? "" : msg.header.id, out);
            out.writeInt(msg.header.code);
            out.writeInt(msg.header.flag);
            
            // 序列化 properties
            byte[] propsBytes = serializeProperties(msg.header.properties);
            out.writeShort((short) propsBytes.length);
            if (propsBytes.length > 0) {
                out.writeBytes(propsBytes);
            }

            int headerSize = out.writerIndex() - headerStart;

            byte[] bodyBytes = msg.body == null ? new byte[0] : msg.body.getBytes(StandardCharsets.UTF_8);
            out.writeBytes(bodyBytes);

            int end = out.writerIndex();
            int total = end - start - 4;
            out.setInt(start, total);
            out.setShort(start + 4, (short) headerSize);
        }
        
        private byte[] serializeProperties(java.util.Map<String, Object> props) {
            if (props == null || props.isEmpty()) {
                return new byte[0];
            }
            try {
                String json = com.alibaba.fastjson.JSON.toJSONString(props);
                return json.getBytes(StandardCharsets.UTF_8);
            } catch (Exception e) {
                return new byte[0];
            }
        }
    }

    private static class Decoder extends ByteToMessageDecoder {
        @Override
        protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {
            if (in.readableBytes() < 4 + 2 + 4 + 2 + 2 + 2 + 4 + 4 + 2) {
                return;
            }
            int magicCode = in.getInt(in.readerIndex() + 6);
            if (magicCode != MAGIC) {
                in.skipBytes(in.readableBytes());
                return;
            }
            in.markReaderIndex();
            int total = in.readInt();
            if (in.readableBytes() < total) {
                in.resetReaderIndex();
                return;
            }
            short headerSize = in.readShort();

            int magic = in.readInt();
            short ver = in.readShort();
            short agentVer = in.readShort();
            String id = readString(in);
            int code = in.readInt();
            int flag = in.readInt();
            int propsLen = in.readShort();
            if (propsLen > 0) {
                in.skipBytes(propsLen);
            }

            int bodyLen = total - headerSize - 2;
            ByteBuf bodyBuf = Unpooled.buffer(bodyLen, bodyLen);
            in.readBytes(bodyBuf, bodyLen);
            String body = bodyBuf.toString(StandardCharsets.UTF_8);
            bodyBuf.release();

            Header h = new Header();
            h.id = id;
            h.code = code;
            h.flag = flag;
            h.agentVersion = agentVer;
            Datagram d = new Datagram();
            d.header = h;
            d.body = body;
            out.add(d);
        }

        private String readString(ByteBuf in) {
            short len = in.readShort();
            if (len <= 0) return "";
            byte[] bs = new byte[len];
            in.readBytes(bs);
            return new String(bs, StandardCharsets.UTF_8);
        }
    }

    private class Handler extends ChannelInboundHandlerAdapter {
        private final Bootstrap bootstrap;
        private ScheduledFuture<?> hbFuture;

        private Handler(Bootstrap bootstrap) {
            this.bootstrap = bootstrap;
        }

        @Override
        public void channelActive(ChannelHandlerContext ctx) {
            channel = ctx.channel();
            sendHeartbeat(ctx.channel());
            hbFuture = ctx.executor().scheduleAtFixedRate(() -> sendHeartbeat(ctx.channel()), heartbeatSec, heartbeatSec, TimeUnit.SECONDS);
        }

        @Override
        public void channelInactive(ChannelHandlerContext ctx) {
            if (hbFuture != null) {
                hbFuture.cancel(false);
                hbFuture = null;
            }
            scheduleReconnect(bootstrap);
        }

        @Override
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            if (!(msg instanceof Datagram)) return;
            Datagram d = (Datagram) msg;
            if (d.header == null) return;
            if (d.header.code == COMMAND_CODE) {
                String cmd = d.body == null ? "" : d.body.trim();
                if ("threadDump".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildThreadDump());
                    return;
                }
                if ("jvmInfo".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildJvmInfo());
                    return;
                }
                if ("gc".equals(cmd)) {
                    System.gc();
                    sendResponse(ctx, d.header.id, "OK");
                    return;
                }
                if ("sysProps".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildSystemProperties());
                    return;
                }
                if ("env".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildEnv());
                    return;
                }
                if ("inputArgs".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildInputArgs());
                    return;
                }
                if ("classLoading".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildClassLoading());
                    return;
                }
                if ("memory".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildMemory());
                    return;
                }
                if ("gcStats".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildGcStats());
                    return;
                }
                if ("threadsSummary".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildThreadsSummary());
                    return;
                }
                if (cmd.startsWith("topThreadsCpu")) {
                    int limit = parseLimit(cmd, 10);
                    boolean runnableOnly = isRunnableOnly(cmd);
                    sendResponse(ctx, d.header.id, buildTopThreadsCpu(limit, runnableOnly));
                    return;
                }
                if ("deadlocks".equals(cmd)) {
                    sendResponse(ctx, d.header.id, buildDeadlocks());
                    return;
                }
                if (cmd.startsWith("jdwpEnable")) {
                    int port = parsePort(cmd, 5005);
                    sendResponse(ctx, d.header.id, enableJdwp(port));
                    return;
                }
                if (cmd.startsWith("jdwpStatus")) {
                    int port = parsePort(cmd, 5005);
                    sendResponse(ctx, d.header.id, jdwpStatus(port));
                    return;
                }
                if (cmd.startsWith("watchAdd")) {
                    sendResponse(ctx, d.header.id, handleWatchAdd(cmd));
                    return;
                }
                if (cmd.startsWith("watchDump")) {
                    sendResponse(ctx, d.header.id, handleWatchDump(cmd));
                    return;
                }
                if (cmd.startsWith("watchClear")) {
                    sendResponse(ctx, d.header.id, handleWatchClear(cmd));
                    return;
                }
                if ("watchList".equals(cmd)) {
                    sendResponse(ctx, d.header.id, WebDebugger.watchList());
                    return;
                }
                if (cmd.startsWith("debugAdd")) {
                    sendResponse(ctx, d.header.id, handleDebugAdd(cmd));
                    return;
                }
                if (cmd.startsWith("debugDump")) {
                    sendResponse(ctx, d.header.id, handleDebugDump(cmd));
                    return;
                }
                if (cmd.startsWith("debugClear")) {
                    sendResponse(ctx, d.header.id, handleDebugClear(cmd));
                    return;
                }
                if ("debugList".equals(cmd)) {
                    sendResponse(ctx, d.header.id, WebDebugger.debugList());
                    return;
                }
                if (cmd.startsWith("startProfiler")) {
                    sendResponse(ctx, d.header.id, handleStartProfiler(cmd));
                    return;
                }
                if (cmd.startsWith("stopProfiler")) {
                    sendResponse(ctx, d.header.id, handleStopProfiler(cmd));
                    return;
                }
            }
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            LogUtil.log("diag agent netty error", cause);
            ctx.close();
        }
    }

    private static String buildThreadDump() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        if (mx.isObjectMonitorUsageSupported() && mx.isSynchronizerUsageSupported()) {
            ThreadInfo[] infos = mx.dumpAllThreads(true, true);
            StringBuilder sb = new StringBuilder();
            for (ThreadInfo info : infos) {
                sb.append('"').append(info.getThreadName()).append('"').append(" Id=").append(info.getThreadId()).append(' ').append(info.getThreadState()).append('\n');
                StackTraceElement[] st = info.getStackTrace();
                for (StackTraceElement e : st) {
                    sb.append("    at ").append(e.toString()).append('\n');
                }
                sb.append('\n');
            }
            return truncate(sb.toString());
        }
        Map<Thread, StackTraceElement[]> all = Thread.getAllStackTraces();
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<Thread, StackTraceElement[]> e : all.entrySet()) {
            Thread t = e.getKey();
            sb.append('"').append(t.getName()).append('"').append(" Id=").append(t.getId()).append(' ').append(t.getState()).append('\n');
            for (StackTraceElement ste : e.getValue()) {
                sb.append("    at ").append(ste.toString()).append('\n');
            }
            sb.append('\n');
        }
        return truncate(sb.toString());
    }

    private static String buildJvmInfo() {
        StringBuilder sb = new StringBuilder();
        sb.append("RuntimeMXBean: ").append(ManagementFactory.getRuntimeMXBean().getName()).append('\n');
        sb.append("UptimeMs: ").append(ManagementFactory.getRuntimeMXBean().getUptime()).append('\n');
        sb.append("StartTimeMs: ").append(ManagementFactory.getRuntimeMXBean().getStartTime()).append('\n');
        sb.append("VmName: ").append(ManagementFactory.getRuntimeMXBean().getVmName()).append('\n');
        sb.append("VmVendor: ").append(ManagementFactory.getRuntimeMXBean().getVmVendor()).append('\n');
        sb.append("VmVersion: ").append(ManagementFactory.getRuntimeMXBean().getVmVersion()).append('\n');
        sb.append('\n');
        sb.append("Heap: ").append(ManagementFactory.getMemoryMXBean().getHeapMemoryUsage().toString()).append('\n');
        sb.append("NonHeap: ").append(ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage().toString()).append('\n');
        sb.append('\n');
        sb.append("ThreadCount: ").append(ManagementFactory.getThreadMXBean().getThreadCount()).append('\n');
        sb.append("PeakThreadCount: ").append(ManagementFactory.getThreadMXBean().getPeakThreadCount()).append('\n');
        sb.append("DaemonThreadCount: ").append(ManagementFactory.getThreadMXBean().getDaemonThreadCount()).append('\n');
        return truncate(sb.toString());
    }

    private static void sendResponse(ChannelHandlerContext ctx, String requestId, String body) {
        Datagram resp = new Datagram();
        resp.header = new Header();
        resp.header.id = requestId;
        resp.header.code = COMMAND_RESPONSE_CODE;
        resp.header.flag = 0;
        resp.header.agentVersion = AGENT_VERSION;
        resp.body = body;
        ctx.channel().writeAndFlush(resp);
    }

    private static String buildSystemProperties() {
        Properties props = System.getProperties();
        TreeMap<String, String> out = new TreeMap<>();
        Set<String> allowKeys = new TreeSet<>(Arrays.asList(
                "file.separator",
                "java.class.path",
                "java.home",
                "java.io.tmpdir",
                "java.runtime.name",
                "java.runtime.version",
                "java.specification.name",
                "java.specification.vendor",
                "java.specification.version",
                "java.vendor",
                "java.vendor.url",
                "java.version",
                "java.vm.info",
                "java.vm.name",
                "java.vm.specification.name",
                "java.vm.specification.vendor",
                "java.vm.specification.version",
                "java.vm.vendor",
                "java.vm.version",
                "line.separator",
                "os.arch",
                "os.name",
                "os.version",
                "path.separator",
                "user.country",
                "user.dir",
                "user.language",
                "user.name",
                "user.timezone"
        ));
        for (String k : allowKeys) {
            String v = props.getProperty(k);
            if (v != null) {
                out.put(k, v);
            }
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : out.entrySet()) {
            sb.append(e.getKey()).append('=').append(e.getValue()).append('\n');
        }
        return truncate(sb.toString());
    }

    private static String buildEnv() {
        Map<String, String> env = System.getenv();
        Set<String> allow = new TreeSet<>(Arrays.asList(
                "JAVA_HOME",
                "PATH",
                "LANG",
                "LC_ALL",
                "TZ",
                "HOSTNAME",
                "COMPUTERNAME",
                "USER",
                "USERNAME",
                "USERDOMAIN"
        ));
        TreeMap<String, String> out = new TreeMap<>();
        for (String k : allow) {
            String v = env.get(k);
            if (v != null) {
                out.put(k, v);
            }
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : out.entrySet()) {
            sb.append(e.getKey()).append('=').append(e.getValue()).append('\n');
        }
        return truncate(sb.toString());
    }

    private static String buildInputArgs() {
        List<String> args = ManagementFactory.getRuntimeMXBean().getInputArguments();
        StringBuilder sb = new StringBuilder();
        for (String a : args) {
            sb.append(redactIfSensitive(a)).append('\n');
        }
        return truncate(sb.toString());
    }

    private static String buildClassLoading() {
        StringBuilder sb = new StringBuilder();
        sb.append("LoadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getLoadedClassCount()).append('\n');
        sb.append("TotalLoadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getTotalLoadedClassCount()).append('\n');
        sb.append("UnloadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getUnloadedClassCount()).append('\n');
        sb.append("Verbose: ").append(ManagementFactory.getClassLoadingMXBean().isVerbose()).append('\n');
        return truncate(sb.toString());
    }

    private static String buildMemory() {
        StringBuilder sb = new StringBuilder();
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        MemoryUsage nonHeap = ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage();
        sb.append("Heap: ").append(formatMem(heap)).append('\n');
        sb.append("NonHeap: ").append(formatMem(nonHeap)).append('\n');
        sb.append('\n');
        List<java.lang.management.MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
        pools.sort(Comparator.comparing(java.lang.management.MemoryPoolMXBean::getName));
        for (java.lang.management.MemoryPoolMXBean p : pools) {
            MemoryUsage u = p.getUsage();
            if (u == null) continue;
            sb.append("Pool: ").append(p.getName()).append(" (").append(p.getType()).append(") ").append(formatMem(u)).append('\n');
        }
        return truncate(sb.toString());
    }

    private static String formatMem(MemoryUsage u) {
        if (u == null) return "";
        return "init=" + u.getInit() + " used=" + u.getUsed() + " committed=" + u.getCommitted() + " max=" + u.getMax();
    }

    private static String buildGcStats() {
        StringBuilder sb = new StringBuilder();
        List<java.lang.management.GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        gcs.sort(Comparator.comparing(java.lang.management.GarbageCollectorMXBean::getName));
        for (java.lang.management.GarbageCollectorMXBean gc : gcs) {
            sb.append("GC: ").append(gc.getName())
                    .append(" count=").append(gc.getCollectionCount())
                    .append(" timeMs=").append(gc.getCollectionTime());
            String[] pools = gc.getMemoryPoolNames();
            if (pools != null && pools.length > 0) {
                sb.append(" pools=").append(String.join(",", pools));
            }
            sb.append('\n');
        }
        return truncate(sb.toString());
    }

    private static String buildThreadsSummary() {
        StringBuilder sb = new StringBuilder();
        ThreadMXBean t = ManagementFactory.getThreadMXBean();
        sb.append("ThreadCount: ").append(t.getThreadCount()).append('\n');
        sb.append("PeakThreadCount: ").append(t.getPeakThreadCount()).append('\n');
        sb.append("DaemonThreadCount: ").append(t.getDaemonThreadCount()).append('\n');
        sb.append("TotalStartedThreadCount: ").append(t.getTotalStartedThreadCount()).append('\n');
        sb.append("ThreadContentionMonitoringEnabled: ").append(t.isThreadContentionMonitoringEnabled()).append('\n');
        sb.append("ThreadCpuTimeSupported: ").append(t.isThreadCpuTimeSupported()).append('\n');
        sb.append("ThreadCpuTimeEnabled: ").append(t.isThreadCpuTimeEnabled()).append('\n');
        return truncate(sb.toString());
    }

    private static int parseLimit(String cmd, int defaultLimit) {
        if (cmd == null || cmd.isEmpty()) return defaultLimit;
        int idx = cmd.indexOf(':');
        if (idx < 0 || idx == cmd.length() - 1) return defaultLimit;
        try {
            int i = idx + 1;
            int n = cmd.length();
            while (i < n && Character.isWhitespace(cmd.charAt(i))) i++;
            int j = i;
            while (j < n && Character.isDigit(cmd.charAt(j))) j++;
            if (j == i) return defaultLimit;
            int v = Integer.parseInt(cmd.substring(i, j));
            if (v < 1) return 1;
            if (v > 50) return 50;
            return v;
        } catch (Exception ignored) {
            return defaultLimit;
        }
    }

    private static boolean isRunnableOnly(String cmd) {
        if (cmd == null || cmd.isEmpty()) return false;
        String s = cmd.toLowerCase();
        return s.contains("runnable");
    }

    private static int parsePort(String cmd, int defaultPort) {
        if (cmd == null || cmd.isEmpty()) return defaultPort;
        int idx = cmd.indexOf(':');
        if (idx < 0 || idx == cmd.length() - 1) return defaultPort;
        try {
            int i = idx + 1;
            int n = cmd.length();
            while (i < n && Character.isWhitespace(cmd.charAt(i))) i++;
            int j = i;
            while (j < n && Character.isDigit(cmd.charAt(j))) j++;
            if (j == i) return defaultPort;
            int v = Integer.parseInt(cmd.substring(i, j));
            if (v < 1) return 1;
            if (v > 65535) return 65535;
            return v;
        } catch (Exception ignored) {
            return defaultPort;
        }
    }

    private static String enableJdwp(int port) {
        if (isPortListening(port, 300)) {
            return "OK alreadyListening port=" + port + "\n";
        }
        if (!isPortAvailable(port)) {
            return "PortInUse port=" + port + "\n";
        }
        String pid = currentPid();
        if (pid == null || pid.isEmpty()) return "PidNotFound\n";
        try {
            Class<?> vmClass = loadVirtualMachineClass();
            Object vm = vmClass.getMethod("attach", String.class).invoke(null, pid);
            try {
                java.util.List<String> optionsList = buildJdwpOptionsList(port);
                StringBuilder errors = new StringBuilder();
                for (String options : optionsList) {
                    try {
                        vmClass.getMethod("loadAgentLibrary", String.class, String.class).invoke(vm, "jdwp", options);
                        boolean listening = isPortListening(port, 1200);
                        return "OK port=" + port + " listening=" + listening + " via=loadAgentLibrary options=" + options + "\n";
                    } catch (Throwable e) {
                        errors.append("loadAgentLibrary options=").append(options).append(" error=").append(formatThrowable(rootCause(e))).append('\n');
                    }
                }
                java.io.File lib = findJdwpLibrary();
                if (lib == null) {
                    return "ERROR JdwpLibraryNotFound java.home=" + System.getProperty("java.home") + "\n" + errors;
                }
                for (String options : optionsList) {
                    try {
                        vmClass.getMethod("loadAgentPath", String.class, String.class).invoke(vm, lib.getAbsolutePath(), options);
                        boolean listening = isPortListening(port, 1200);
                        return "OK port=" + port + " listening=" + listening + " via=loadAgentPath lib=" + lib.getAbsolutePath() + " options=" + options + "\n";
                    } catch (Throwable e) {
                        errors.append("loadAgentPath lib=").append(lib.getAbsolutePath())
                                .append(" options=").append(options)
                                .append(" error=").append(formatThrowable(rootCause(e))).append('\n');
                    }
                }
                String hint = "Hint: start JVM with -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=" + port + "\n";
                String env = "Env: java.version=" + System.getProperty("java.version") + " java.home=" + System.getProperty("java.home") + "\n";
                return "ERROR FailedToEnableJdwp port=" + port + "\n" + env + hint + errors;
            } finally {
                vmClass.getMethod("detach").invoke(vm);
            }
        } catch (ClassNotFoundException e) {
            return "AttachNotAvailable\n";
        } catch (Throwable t) {
            Throwable x = rootCause(t);
            String msg = formatThrowable(x);
            String hint = "";
            if (msg.contains("allowAttachSelf") || msg.contains("AttachNotSupported")) {
                hint = " hint=try -Djdk.attach.allowAttachSelf=true";
            }
            return "ERROR " + msg + hint + "\n";
        }
    }

    private static String jdwpStatus(int port) {
        boolean listening = isPortListening(port, 300);
        return "Listening: " + listening + " port=" + port + "\n";
    }

    private static String handleWatchAdd(String cmd) {
        String[] parts = cmd.split(":", 5);
        if (parts.length < 3) return "Usage watchAdd:<class>:<method>[:limit][:paramTypes]\n";
        String className = decode(parts[1]);
        String methodName = decode(parts[2]);
        int limit = 50;
        if (parts.length >= 4) {
            try {
                limit = Integer.parseInt(parts[3]);
            } catch (Exception ignored) {
            }
        }
        String paramTypes = parts.length >= 5 ? decode(parts[4]) : "";
        return WebDebugger.watchAdd(className, methodName, paramTypes, limit);
    }

    private static String handleWatchDump(String cmd) {
        String[] parts = cmd.split(":", 3);
        if (parts.length < 2) return "Usage watchDump:<id>[:maxLines]\n";
        String id = parts[1];
        int maxLines = 200;
        if (parts.length >= 3) {
            try {
                maxLines = Integer.parseInt(parts[2]);
            } catch (Exception ignored) {
            }
        }
        return WebDebugger.watchDump(id, maxLines);
    }

    private static String handleWatchClear(String cmd) {
        String[] parts = cmd.split(":", 2);
        if (parts.length < 2) return "Usage watchClear:<id>\n";
        return WebDebugger.watchClear(parts[1]);
    }

    private static String handleDebugAdd(String cmd) {
        String[] parts = cmd.split(":", 9);
        if (parts.length < 4) return "Usage debugAdd:<class>:<method>:<when>[:limit][:stackDepth][:paramTypes][:contains]\n";
        String className = decode(parts[1]);
        String methodName = decode(parts[2]);
        String when = decode(parts[3]);
        int limit = parts.length >= 5 ? parseInt(parts[4], 20) : 20;
        int stackDepth = parts.length >= 6 ? parseInt(parts[5], 0) : 0;
        String paramTypes = "";
        String contains = "";
        if (parts.length >= 8) {
            contains = decode(parts[6]);
            paramTypes = decode(parts[7]);
        } else if (parts.length >= 7) {
            String tail = decode(parts[6]);
            if (looksLikeParamTypes(tail)) {
                paramTypes = tail;
            } else {
                contains = tail;
            }
        }
        return WebDebugger.debugAdd(className, methodName, when, paramTypes, limit, stackDepth, contains);
    }

    private static boolean looksLikeParamTypes(String s) {
        if (s == null) return false;
        String x = s.trim();
        if (x.isEmpty()) return false;
        if (x.indexOf('.') >= 0) return true;
        if (x.indexOf(',') >= 0) return true;
        if ("boolean".equals(x) || "byte".equals(x) || "short".equals(x) || "char".equals(x) || "int".equals(x) || "long".equals(x) || "float".equals(x) || "double".equals(x)) return true;
        if (x.endsWith("[]")) return true;
        return false;
    }

    private static String handleDebugDump(String cmd) {
        String[] parts = cmd.split(":", 4);
        if (parts.length < 2) return "Usage debugDump:<id>[:maxLines]\n";
        String id = decode(parts[1]);
        int maxLines = parts.length >= 3 ? parseInt(parts[2], 200) : 200;
        return WebDebugger.debugDump(id, maxLines);
    }

    private static String handleDebugClear(String cmd) {
        String[] parts = cmd.split(":", 2);
        if (parts.length < 2) return "Usage debugClear:<id>\n";
        return WebDebugger.debugClear(decode(parts[1]));
    }

    private static String handleStartProfiler(String cmd) {
        String[] parts = cmd.split(":", 3);
        String event = "cpu";
        int duration = 30; // default 30 seconds
        if (parts.length >= 2) {
            event = parts[1];
        }
        if (parts.length >= 3) {
            duration = parseInt(parts[2], 30);
        }
        
        try {
            Class<?> clazz = Class.forName("org.xi.lt.agent.common.AsyncProfilerUtil", true, Thread.currentThread().getContextClassLoader());
            Boolean isLoaded = (Boolean) clazz.getMethod("isLoaded").invoke(null);
            if (!isLoaded) {
                return "Error: AsyncProfiler is not loaded in this JVM.";
            }
            
            // start profiling
            String result = (String) clazz.getMethod("execute", String.class).invoke(null, "start,event=" + event);
            return "Profiler started. Event=" + event + ". Use stopProfiler to get the flame graph.\n" + result;
        } catch (Throwable t) {
            return "Error starting profiler: " + t.getMessage();
        }
    }

    private static String handleStopProfiler(String cmd) {
        try {
            Class<?> clazz = Class.forName("org.xi.lt.agent.common.AsyncProfilerUtil", true, Thread.currentThread().getContextClassLoader());
            Boolean isLoaded = (Boolean) clazz.getMethod("isLoaded").invoke(null);
            if (!isLoaded) {
                return "Error: AsyncProfiler is not loaded in this JVM.";
            }
            
            // create temp file
            java.io.File tempFile = java.io.File.createTempFile("lt-profiler-", ".html");
            String path = tempFile.getAbsolutePath();
            
            // stop profiling and save to html
            String executeResult = (String) clazz.getMethod("execute", String.class).invoke(null, "stop,file=" + path);
            
            // read html content
            StringBuilder content = new StringBuilder();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(tempFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }
            
            // clean up
            tempFile.delete();
            
            if (content.length() == 0) {
                return "Error: Flame graph file is empty.\n" + executeResult;
            }
            
            return content.toString();
        } catch (Throwable t) {
            return "Error stopping profiler: " + t.getMessage();
        }
    }

    private static String decode(String s) {
        if (s == null) return "";
        try {
            return java.net.URLDecoder.decode(s, "UTF-8");
        } catch (Exception ignored) {
            return s;
        }
    }

    private static int parseInt(String s, int def) {
        if (s == null) return def;
        try {
            return Integer.parseInt(s);
        } catch (Exception ignored) {
            return def;
        }
    }

    private static boolean isPortListening(int port, int timeoutMs) {
        java.net.Socket s = new java.net.Socket();
        try {
            s.connect(new java.net.InetSocketAddress("127.0.0.1", port), timeoutMs);
            return true;
        } catch (Exception ignored) {
            return false;
        } finally {
            try {
                s.close();
            } catch (Exception ignored) {
            }
        }
    }

    private static String currentPid() {
        try {
            String name = ManagementFactory.getRuntimeMXBean().getName();
            String pid = name == null ? "" : name.split("@")[0];
            if (pid != null && !pid.isEmpty()) return pid;
        } catch (Exception ignored) {
        }
        try {
            Class<?> ph = Class.forName("java.lang.ProcessHandle");
            Object cur = ph.getMethod("current").invoke(null);
            Object v = ph.getMethod("pid").invoke(cur);
            return String.valueOf(v);
        } catch (Exception ignored) {
        }
        return "";
    }

    private static java.util.List<String> buildJdwpOptionsList(int port) {
        java.util.List<String> list = new java.util.ArrayList<>();
        list.add("transport=dt_socket,server=y,suspend=n,address=" + port);
        list.add("transport=dt_socket,server=y,suspend=n,address=127.0.0.1:" + port);
        list.add("transport=dt_socket,server=y,suspend=n,address=*:" + port);
        return list;
    }

    private static boolean isPortAvailable(int port) {
        java.net.ServerSocket ss = null;
        try {
            ss = new java.net.ServerSocket();
            ss.setReuseAddress(true);
            ss.bind(new java.net.InetSocketAddress("127.0.0.1", port));
            return true;
        } catch (Exception ignored) {
            return false;
        } finally {
            if (ss != null) {
                try {
                    ss.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private static java.io.File findJdwpLibrary() {
        String os = String.valueOf(System.getProperty("os.name")).toLowerCase();
        String javaHome = System.getProperty("java.home");
        if (javaHome == null || javaHome.isEmpty()) return null;
        java.io.File home = new java.io.File(javaHome);
        java.io.File jdkHome = home.getName().equalsIgnoreCase("jre") ? home.getParentFile() : home;
        String arch = String.valueOf(System.getProperty("os.arch")).toLowerCase();
        String[] archCandidates = new String[]{arch, "amd64", "x86_64", "aarch64"};
        java.util.List<java.io.File> files = new java.util.ArrayList<>();
        if (os.contains("win")) {
            files.add(new java.io.File(new java.io.File(home, "bin"), "jdwp.dll"));
            files.add(new java.io.File(new java.io.File(new java.io.File(home, "jre"), "bin"), "jdwp.dll"));
            if (jdkHome != null) {
                files.add(new java.io.File(new java.io.File(jdkHome, "bin"), "jdwp.dll"));
                files.add(new java.io.File(new java.io.File(new java.io.File(jdkHome, "jre"), "bin"), "jdwp.dll"));
            }
        } else if (os.contains("mac")) {
            for (String a : archCandidates) {
                files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(home, "lib"), a), "server"), "libjdwp.dylib"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "lib"), a), "libjdwp.dylib"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "lib"), "server"), "libjdwp.dylib"));
                files.add(new java.io.File(new java.io.File(home, "lib"), "libjdwp.dylib"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "jre"), "lib"), "libjdwp.dylib"));
            }
            if (jdkHome != null) {
                for (String a : archCandidates) {
                    files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(jdkHome, "lib"), a), "server"), "libjdwp.dylib"));
                    files.add(new java.io.File(new java.io.File(new java.io.File(jdkHome, "jre"), "lib"), "libjdwp.dylib"));
                }
            }
        } else {
            for (String a : archCandidates) {
                files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(home, "lib"), a), "server"), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "lib"), a), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "lib"), "server"), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(home, "lib"), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(new java.io.File(home, "jre"), "lib"), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(home, "jre"), "lib"), a), "libjdwp.so"));
                files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(new java.io.File(home, "jre"), "lib"), a), "server"), "libjdwp.so"));
            }
            if (jdkHome != null) {
                for (String a : archCandidates) {
                    files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(jdkHome, "lib"), a), "server"), "libjdwp.so"));
                    files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(jdkHome, "jre"), "lib"), a), "libjdwp.so"));
                    files.add(new java.io.File(new java.io.File(new java.io.File(new java.io.File(new java.io.File(jdkHome, "jre"), "lib"), a), "server"), "libjdwp.so"));
                }
            }
        }
        for (java.io.File f : files) {
            if (f != null && f.exists() && f.isFile()) return f;
        }
        return null;
    }

    private static Throwable rootCause(Throwable t) {
        Throwable x = t;
        while (x != null && x.getCause() != null) x = x.getCause();
        return x == null ? t : x;
    }

    private static String formatThrowable(Throwable t) {
        if (t == null) return "";
        String msg = t.getMessage();
        if (msg == null || msg.isEmpty()) msg = t.toString();
        return t.getClass().getName() + ": " + msg;
    }

    private static Class<?> loadVirtualMachineClass() throws Exception {
        try {
            return Class.forName("com.sun.tools.attach.VirtualMachine");
        } catch (ClassNotFoundException e) {
            java.io.File toolsJar = findToolsJar();
            if (toolsJar == null) throw e;
            tryAddToolsJarToSystemClassLoader(toolsJar.toURI().toURL());
            return Class.forName("com.sun.tools.attach.VirtualMachine");
        }
    }

    private static java.io.File findToolsJar() {
        String javaHome = System.getProperty("java.home");
        if (javaHome == null || javaHome.isEmpty()) return null;
        java.io.File home = new java.io.File(javaHome);
        java.io.File jdkHome = home.getName().equalsIgnoreCase("jre") ? home.getParentFile() : home;
        if (jdkHome == null) return null;
        java.io.File tools = new java.io.File(new java.io.File(jdkHome, "lib"), "tools.jar");
        if (tools.exists() && tools.isFile()) return tools;
        return null;
    }

    private static void tryAddToolsJarToSystemClassLoader(java.net.URL url) throws Exception {
        ClassLoader cl = ClassLoader.getSystemClassLoader();
        if (!(cl instanceof java.net.URLClassLoader)) return;
        java.net.URLClassLoader ucl = (java.net.URLClassLoader) cl;
        java.lang.reflect.Method addURL = java.net.URLClassLoader.class.getDeclaredMethod("addURL", java.net.URL.class);
        addURL.setAccessible(true);
        addURL.invoke(ucl, url);
    }

    private static String buildTopThreadsCpu(int limit, boolean runnableOnly) {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        if (!mx.isThreadCpuTimeSupported()) {
            return "ThreadCpuTimeSupported: false\n";
        }
        if (!mx.isThreadCpuTimeEnabled()) {
            try {
                mx.setThreadCpuTimeEnabled(true);
            } catch (Exception e) {
                return "ThreadCpuTimeEnabled: false\n";
            }
        }

        long[] ids = mx.getAllThreadIds();
        List<long[]> pairs = new ArrayList<>();
        for (long id : ids) {
            long ns = mx.getThreadCpuTime(id);
            if (ns < 0) continue;
            pairs.add(new long[]{id, ns});
        }
        pairs.sort((a, b) -> Long.compare(b[1], a[1]));

        StringBuilder sb = new StringBuilder();
        sb.append("ThreadCpuTimeEnabled: ").append(mx.isThreadCpuTimeEnabled()).append('\n');
        sb.append("RunnableOnly: ").append(runnableOnly).append('\n');
        sb.append("Limit: ").append(limit).append('\n');
        sb.append('\n');
        int rank = 0;
        int emitted = 0;
        for (int i = 0; i < pairs.size() && emitted < limit; i++) {
            long id = pairs.get(i)[0];
            long ns = pairs.get(i)[1];
            ThreadInfo info = mx.getThreadInfo(id, 10);
            String name = info == null ? "" : info.getThreadName();
            String state = info == null ? "" : String.valueOf(info.getThreadState());
            if (runnableOnly && info != null && info.getThreadState() != Thread.State.RUNNABLE) {
                continue;
            }
            rank++;
            emitted++;
            sb.append('#').append(rank).append(' ')
                    .append("Id=").append(id).append(' ')
                    .append('"').append(name).append('"').append(' ')
                    .append(state).append(' ')
                    .append("cpuMs=").append(ns / 1_000_000).append('\n');
            if (info != null) {
                for (StackTraceElement ste : info.getStackTrace()) {
                    sb.append("    at ").append(ste.toString()).append('\n');
                }
            }
            sb.append('\n');
        }
        sb.insert(0, "TopN: " + emitted + "\n");
        return truncate(sb.toString());
    }

    private static String buildDeadlocks() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        long[] ids;
        try {
            ids = mx.findDeadlockedThreads();
        } catch (Exception e) {
            return "DeadlockDetectUnsupported\n";
        }
        if (ids == null || ids.length == 0) {
            return "NoDeadlocks\n";
        }
        ThreadInfo[] infos = mx.getThreadInfo(ids, true, true);
        StringBuilder sb = new StringBuilder();
        sb.append("DeadlockedThreadCount: ").append(infos == null ? 0 : infos.length).append('\n');
        sb.append('\n');
        if (infos != null) {
            for (ThreadInfo info : infos) {
                if (info == null) continue;
                sb.append('"').append(info.getThreadName()).append('"')
                        .append(" Id=").append(info.getThreadId()).append(' ')
                        .append(info.getThreadState()).append('\n');
                if (info.getLockName() != null) {
                    sb.append("  Lock: ").append(info.getLockName()).append('\n');
                }
                if (info.getLockOwnerName() != null) {
                    sb.append("  LockOwner: ").append(info.getLockOwnerName()).append(" Id=").append(info.getLockOwnerId()).append('\n');
                }
                for (StackTraceElement ste : info.getStackTrace()) {
                    sb.append("    at ").append(ste.toString()).append('\n');
                }
                sb.append('\n');
            }
        }
        return truncate(sb.toString());
    }

    private static String redactIfSensitive(String s) {
        if (s == null) return "";
        String lower = s.toLowerCase();
        boolean sensitive = lower.contains("password")
                || lower.contains("passwd")
                || lower.contains("secret")
                || lower.contains("token")
                || lower.contains("accesskey")
                || lower.contains("secretkey")
                || lower.contains("apikey");
        if (!sensitive) return s;
        int idx = s.indexOf('=');
        if (idx >= 0) {
            return s.substring(0, idx + 1) + "<redacted>";
        }
        return "<redacted>";
    }

    private static String truncate(String s) {
        int max = 200_000;
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max);
    }
}

