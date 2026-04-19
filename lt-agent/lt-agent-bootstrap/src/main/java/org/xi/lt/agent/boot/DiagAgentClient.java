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
import java.lang.management.MemoryMXBean;
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
    
    // 重连相关
    private volatile int reconnectAttempts = 0;
    private static final int MAX_RECONNECT_DELAY_SEC = 60; // 最大重连延迟 60 秒
    private static final int BASE_RECONNECT_DELAY_SEC = 2; // 基础重连延迟 2 秒

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
                LogUtil.log("diag agent connect failed, will retry. cause: " + future.cause().getMessage());
                scheduleReconnect(bootstrap);
            } else {
                // 连接成功，重置重连计数
                reconnectAttempts = 0;
                LogUtil.log("diag agent connected successfully");
            }
        });
    }

    private void scheduleReconnect(Bootstrap bootstrap) {
        // 指数退避策略：2s, 4s, 8s, 16s, 32s, 60s, 60s, ...
        reconnectAttempts++;
        int delaySec = Math.min(BASE_RECONNECT_DELAY_SEC * (int) Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY_SEC);
        
        LogUtil.log("diag agent scheduling reconnect in " + delaySec + " seconds (attempt #" + reconnectAttempts + ")");
        group.schedule(() -> connect(bootstrap), delaySec, TimeUnit.SECONDS);
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
        
        // 添加内存指标数据
        try {
            d.header.properties.put("metrics", buildMemoryMetrics());
        } catch (Exception e) {
            // 忽略指标采集错误
        }
        
        d.body = agentId;
        ch.writeAndFlush(d);
    }
    
    /**
     * 构建内存指标数据（用于心跳上报）
     */
    private static java.util.Map<String, Object> buildMemoryMetrics() {
        java.util.Map<String, Object> metrics = new java.util.HashMap<>();
        
        try {
            java.lang.management.MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heap = memoryMXBean.getHeapMemoryUsage();
            MemoryUsage nonHeap = memoryMXBean.getNonHeapMemoryUsage();
            
            // Heap Memory
            metrics.put("heapUsed", heap.getUsed());
            metrics.put("heapCommitted", heap.getCommitted());
            metrics.put("heapMax", heap.getMax());
            
            // Non-Heap Memory
            metrics.put("nonHeapUsed", nonHeap.getUsed());
            metrics.put("nonHeapCommitted", nonHeap.getCommitted());
            metrics.put("nonHeapMax", nonHeap.getMax());
            
            // Thread & Class
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            metrics.put("threadCount", threadMXBean.getThreadCount());
            metrics.put("peakThreadCount", threadMXBean.getPeakThreadCount());
            metrics.put("daemonThreadCount", threadMXBean.getDaemonThreadCount());
            
            // Thread states distribution
            java.util.Map<String, Integer> threadStates = new java.util.HashMap<>();
            try {
                java.lang.management.ThreadInfo[] threadInfos = threadMXBean.dumpAllThreads(false, false);
                for (java.lang.management.ThreadInfo info : threadInfos) {
                    if (info != null) {
                        String state = info.getThreadState().toString();
                        threadStates.put(state, threadStates.getOrDefault(state, 0) + 1);
                    }
                }
            } catch (Exception e) {
                // 忽略线程dump错误
            }
            metrics.put("threadStates", threadStates);
            
            // JVM start time
            long jvmStartTime = 0;
            try {
                jvmStartTime = ManagementFactory.getRuntimeMXBean().getStartTime();
            } catch (Exception e) {
                // 忽略
            }
            metrics.put("jvmStartTime", jvmStartTime);
            
            java.lang.management.ClassLoadingMXBean classMXBean = ManagementFactory.getClassLoadingMXBean();
            metrics.put("loadedClassCount", classMXBean.getLoadedClassCount());
            metrics.put("totalLoadedClassCount", classMXBean.getTotalLoadedClassCount());
            metrics.put("unloadedClassCount", classMXBean.getUnloadedClassCount());
            
            // GC - 区分Minor GC和Full GC
            long totalGcCount = 0;
            long totalGcTime = 0;
            long minorGcCount = 0;
            long minorGcTime = 0;
            long fullGcCount = 0;
            long fullGcTime = 0;
            
            for (java.lang.management.GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
                long count = gc.getCollectionCount();
                long time = gc.getCollectionTime();
                totalGcCount += count;
                totalGcTime += time;
                
                String gcName = gc.getName();
                // 根据GC名称判断类型
                if (gcName.contains("Young") || gcName.contains("PS Scavenge") || 
                    gcName.contains("ParNew") || gcName.contains("G1 Young Generation")) {
                    minorGcCount += count;
                    minorGcTime += time;
                } else if (gcName.contains("Old") || gcName.contains("PS MarkSweep") || 
                           gcName.contains("ConcurrentMarkSweep") || gcName.contains("G1 Old Generation")) {
                    fullGcCount += count;
                    fullGcTime += time;
                } else {
                    // 未知类型，默认计入Minor GC
                    minorGcCount += count;
                    minorGcTime += time;
                }
            }
            metrics.put("gcCount", totalGcCount);
            metrics.put("gcTimeMs", totalGcTime);
            metrics.put("minorGcCount", minorGcCount);
            metrics.put("minorGcTimeMs", minorGcTime);
            metrics.put("fullGcCount", fullGcCount);
            metrics.put("fullGcTimeMs", fullGcTime);
            
            // CPU (from OperatingSystemMXBean)
            try {
                com.sun.management.OperatingSystemMXBean osMXBean = 
                    (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
                metrics.put("processCpuLoad", osMXBean.getProcessCpuLoad());
                metrics.put("systemCpuLoad", osMXBean.getSystemCpuLoad());
            } catch (Exception e) {
                // 某些JVM可能不支持
            }
            
            // Memory Pools Detail (Eden, Survivor, Old Gen, etc.)
            java.util.List<java.util.Map<String, Object>> pools = new java.util.ArrayList<>();
            for (java.lang.management.MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
                MemoryUsage usage = pool.getUsage();
                if (usage == null) continue;
                
                java.util.Map<String, Object> poolData = new java.util.HashMap<>();
                poolData.put("name", pool.getName());
                poolData.put("type", pool.getType().toString());
                poolData.put("used", usage.getUsed());
                poolData.put("committed", usage.getCommitted());
                poolData.put("max", usage.getMax());
                poolData.put("init", usage.getInit());
                
                pools.add(poolData);
            }
            metrics.put("pools", pools);
            
            // Top CPU Threads - 获取CPU占用最高的10个线程
            try {
                long[] threadIds = threadMXBean.getAllThreadIds();
                java.util.List<java.util.Map<String, Object>> topThreads = new java.util.ArrayList<>();
                
                if (threadIds != null && threadIds.length > 0) {
                    // 获取每个线程的CPU时间
                    java.util.Map<Long, Long> threadCpuTimes = new java.util.HashMap<>();
                    for (long tid : threadIds) {
                        long cpuTime = threadMXBean.getThreadCpuTime(tid);
                        if (cpuTime >= 0) {
                            threadCpuTimes.put(tid, cpuTime);
                        }
                    }
                    
                    // 按CPU时间排序，取前10个
                    threadCpuTimes.entrySet().stream()
                        .sorted(java.util.Map.Entry.<Long, Long>comparingByValue().reversed())
                        .limit(10)
                        .forEach(entry -> {
                            java.util.Map<String, Object> threadInfo = new java.util.HashMap<>();
                            long tid = entry.getKey();
                            java.lang.management.ThreadInfo info = threadMXBean.getThreadInfo(tid);
                            if (info != null) {
                                threadInfo.put("threadId", tid);
                                threadInfo.put("threadName", info.getThreadName());
                                threadInfo.put("cpuTimeNs", entry.getValue());
                                threadInfo.put("state", info.getThreadState().toString());
                                threadInfo.put("blockedCount", info.getBlockedCount());
                                threadInfo.put("waitedCount", info.getWaitedCount());
                                topThreads.add(threadInfo);
                            }
                        });
                }
                metrics.put("topCpuThreads", topThreads);
            } catch (Exception e) {
                // 忽略线程CPU采集错误
            }
            
            // Thread Pool Info - 尝试获取Tomcat/Undertow线程池信息
            try {
                java.util.List<java.util.Map<String, Object>> threadPools = new java.util.ArrayList<>();
                
                // 通过反射获取Tomcat线程池
                try {
                    Class<?> tomcatClass = Class.forName("org.apache.tomcat.util.threads.ThreadPoolExecutor");
                    // 这里简化处理，实际需要通过JMX或反射获取具体实例
                    // 由于心跳中无法直接获取Spring容器中的Bean，我们只记录已知的线程池名称
                } catch (ClassNotFoundException e) {
                    // 不是Tomcat
                }
                
                // 统计常见线程池的线程数（通过线程名前缀）
                java.util.Map<String, Integer> poolStats = new java.util.HashMap<>();
                java.lang.management.ThreadInfo[] allThreads = threadMXBean.dumpAllThreads(false, false);
                if (allThreads != null) {
                    for (java.lang.management.ThreadInfo info : allThreads) {
                        if (info != null) {
                            String name = info.getThreadName();
                            if (name.startsWith("http-nio-")) {
                                poolStats.merge("tomcat-http", 1, Integer::sum);
                            } else if (name.startsWith("XNIO-")) {
                                poolStats.merge("undertow-xnio", 1, Integer::sum);
                            } else if (name.startsWith("pool-")) {
                                poolStats.merge("java-thread-pool", 1, Integer::sum);
                            } else if (name.startsWith("ForkJoinPool")) {
                                poolStats.merge("forkjoin-pool", 1, Integer::sum);
                            }
                        }
                    }
                }
                
                for (java.util.Map.Entry<String, Integer> entry : poolStats.entrySet()) {
                    java.util.Map<String, Object> poolInfo = new java.util.HashMap<>();
                    poolInfo.put("poolName", entry.getKey());
                    poolInfo.put("activeCount", entry.getValue());
                    threadPools.add(poolInfo);
                }
                metrics.put("threadPools", threadPools);
            } catch (Exception e) {
                // 忽略线程池采集错误
            }
            
            // GC Efficiency - 记录GC前后的内存快照（用于计算GC效率）
            try {
                java.util.Map<String, Long> gcBeforeSnapshot = new java.util.HashMap<>();
                for (java.lang.management.GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
                    String gcName = gc.getName();
                    long count = gc.getCollectionCount();
                    gcBeforeSnapshot.put(gcName + "_count", count);
                }
                // 记录当前堆内存使用量
                gcBeforeSnapshot.put("heap_used", heap.getUsed());
                gcBeforeSnapshot.put("non_heap_used", nonHeap.getUsed());
                metrics.put("gcSnapshot", gcBeforeSnapshot);
            } catch (Exception e) {
                // 忽略
            }
            
            // Timestamp
            metrics.put("collectTime", System.currentTimeMillis());
            
        } catch (Exception e) {
            // 忽略错误
            e.printStackTrace();
        }
        
        return metrics;
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
                if ("readConfig".equals(cmd)) {
                    sendResponse(ctx, d.header.id, readConfigFile());
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
        
        // === Runtime Information ===
        sb.append("=== Runtime Information ===\n");
        sb.append("PID: ").append(currentPid()).append('\n');
        sb.append("RuntimeMXBean: ").append(ManagementFactory.getRuntimeMXBean().getName()).append('\n');
        sb.append("UptimeMs: ").append(ManagementFactory.getRuntimeMXBean().getUptime()).append('\n');
        sb.append("StartTimeMs: ").append(ManagementFactory.getRuntimeMXBean().getStartTime()).append('\n');
        sb.append("StartTime: ").append(new java.util.Date(ManagementFactory.getRuntimeMXBean().getStartTime())).append('\n');
        sb.append("VmName: ").append(ManagementFactory.getRuntimeMXBean().getVmName()).append('\n');
        sb.append("VmVendor: ").append(ManagementFactory.getRuntimeMXBean().getVmVendor()).append('\n');
        sb.append("VmVersion: ").append(ManagementFactory.getRuntimeMXBean().getVmVersion()).append('\n');
        sb.append("SpecName: ").append(ManagementFactory.getRuntimeMXBean().getSpecName()).append('\n');
        sb.append("SpecVendor: ").append(ManagementFactory.getRuntimeMXBean().getSpecVendor()).append('\n');
        sb.append("SpecVersion: ").append(ManagementFactory.getRuntimeMXBean().getSpecVersion()).append('\n');
        sb.append("BootClassPathSupported: ").append(ManagementFactory.getRuntimeMXBean().isBootClassPathSupported()).append('\n');
        sb.append('\n');
        
        // === Memory Information ===
        sb.append("=== Memory Information ===\n");
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        MemoryUsage nonHeap = ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage();
        sb.append("Heap:\n");
        sb.append("  init: ").append(formatBytes(heap.getInit())).append('\n');
        sb.append("  used: ").append(formatBytes(heap.getUsed())).append('\n');
        sb.append("  committed: ").append(formatBytes(heap.getCommitted())).append('\n');
        sb.append("  max: ").append(formatBytes(heap.getMax())).append('\n');
        sb.append("  usage: ").append(heap.getMax() > 0 ? String.format("%.2f%%", heap.getUsed() * 100.0 / heap.getMax()) : "N/A").append('\n');
        sb.append("NonHeap:\n");
        sb.append("  init: ").append(formatBytes(nonHeap.getInit())).append('\n');
        sb.append("  used: ").append(formatBytes(nonHeap.getUsed())).append('\n');
        sb.append("  committed: ").append(formatBytes(nonHeap.getCommitted())).append('\n');
        sb.append("  max: ").append(formatBytes(nonHeap.getMax())).append('\n');
        sb.append('\n');
        
        // === Thread Information ===
        sb.append("=== Thread Information ===\n");
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        sb.append("ThreadCount: ").append(threadBean.getThreadCount()).append('\n');
        sb.append("PeakThreadCount: ").append(threadBean.getPeakThreadCount()).append('\n');
        sb.append("DaemonThreadCount: ").append(threadBean.getDaemonThreadCount()).append('\n');
        sb.append("TotalStartedThreadCount: ").append(threadBean.getTotalStartedThreadCount()).append('\n');
        sb.append("ThreadContentionMonitoringEnabled: ").append(threadBean.isThreadContentionMonitoringEnabled()).append('\n');
        sb.append("ThreadCpuTimeSupported: ").append(threadBean.isThreadCpuTimeSupported()).append('\n');
        sb.append("ThreadCpuTimeEnabled: ").append(threadBean.isThreadCpuTimeEnabled()).append('\n');
        sb.append("CurrentThreadCpuTimeSupported: ").append(threadBean.isCurrentThreadCpuTimeSupported()).append('\n');
        sb.append('\n');
        
        // === Class Loading Information ===
        sb.append("=== Class Loading Information ===\n");
        sb.append("LoadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getLoadedClassCount()).append('\n');
        sb.append("TotalLoadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getTotalLoadedClassCount()).append('\n');
        sb.append("UnloadedClassCount: ").append(ManagementFactory.getClassLoadingMXBean().getUnloadedClassCount()).append('\n');
        sb.append("Verbose: ").append(ManagementFactory.getClassLoadingMXBean().isVerbose()).append('\n');
        sb.append('\n');
        
        // === Operating System Information ===
        sb.append("=== Operating System Information ===\n");
        com.sun.management.OperatingSystemMXBean osBean = 
            (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        sb.append("OS Name: ").append(osBean.getName()).append('\n');
        sb.append("OS Version: ").append(osBean.getVersion()).append('\n');
        sb.append("OS Arch: ").append(osBean.getArch()).append('\n');
        sb.append("Available Processors: ").append(osBean.getAvailableProcessors()).append('\n');
        sb.append("System Load Average: ").append(osBean.getSystemLoadAverage()).append('\n');
        sb.append("Total Physical Memory: ").append(formatBytes(osBean.getTotalPhysicalMemorySize())).append('\n');
        sb.append("Free Physical Memory: ").append(formatBytes(osBean.getFreePhysicalMemorySize())).append('\n');
        sb.append("Committed Virtual Memory: ").append(formatBytes(osBean.getCommittedVirtualMemorySize())).append('\n');
        sb.append("Total Swap Space: ").append(formatBytes(osBean.getTotalSwapSpaceSize())).append('\n');
        sb.append("Free Swap Space: ").append(formatBytes(osBean.getFreeSwapSpaceSize())).append('\n');
        sb.append("Process CPU Load: ").append(String.format("%.2f%%", osBean.getProcessCpuLoad() * 100)).append('\n');
        sb.append("System CPU Load: ").append(String.format("%.2f%%", osBean.getSystemCpuLoad() * 100)).append('\n');
        sb.append('\n');
        
        // === Garbage Collection Summary ===
        sb.append("=== Garbage Collection Summary ===\n");
        List<java.lang.management.GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        long totalGcCount = 0;
        long totalGcTime = 0;
        for (java.lang.management.GarbageCollectorMXBean gc : gcs) {
            sb.append("GC: ").append(gc.getName())
                    .append(" count=").append(gc.getCollectionCount())
                    .append(" time=").append(formatDuration(gc.getCollectionTime()));
            String[] pools = gc.getMemoryPoolNames();
            if (pools != null && pools.length > 0) {
                sb.append(" pools=").append(String.join(",", pools));
            }
            sb.append('\n');
            totalGcCount += gc.getCollectionCount();
            totalGcTime += gc.getCollectionTime();
        }
        sb.append("Total GC Count: ").append(totalGcCount).append('\n');
        sb.append("Total GC Time: ").append(formatDuration(totalGcTime)).append('\n');
        
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
        
        // === Memory Overview ===
        sb.append("=== Memory Overview ===\n");
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap = memoryMXBean.getHeapMemoryUsage();
        MemoryUsage nonHeap = memoryMXBean.getNonHeapMemoryUsage();
        
        sb.append("Heap:\n");
        sb.append("  Used: ").append(formatBytes(heap.getUsed())).append(" (" + heap.getUsed() + " bytes)\n");
        sb.append("  Committed: ").append(formatBytes(heap.getCommitted())).append(" (" + heap.getCommitted() + " bytes)\n");
        sb.append("  Max: ").append(formatBytes(heap.getMax())).append(" (" + heap.getMax() + " bytes)\n");
        double heapPercent = heap.getMax() > 0 ? (heap.getUsed() * 100.0 / heap.getMax()) : 0;
        sb.append("  Usage: ").append(String.format("%.2f", heapPercent)).append("%\n");
        sb.append("\n");
        
        sb.append("Non-Heap:\n");
        sb.append("  Used: ").append(formatBytes(nonHeap.getUsed())).append(" (" + nonHeap.getUsed() + " bytes)\n");
        sb.append("  Committed: ").append(formatBytes(nonHeap.getCommitted())).append(" (" + nonHeap.getCommitted() + " bytes)\n");
        sb.append("  Max: ").append(formatBytes(nonHeap.getMax())).append(" (" + nonHeap.getMax() + " bytes)\n");
        double nonHeapPercent = nonHeap.getMax() > 0 ? (nonHeap.getUsed() * 100.0 / nonHeap.getMax()) : 0;
        sb.append("  Usage: ").append(String.format("%.2f", nonHeapPercent)).append("%\n");
        sb.append("\n");
        
        // === Memory Pools Detail ===
        sb.append("=== Memory Pools Detail ===\n");
        List<java.lang.management.MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
        pools.sort(Comparator.comparing(java.lang.management.MemoryPoolMXBean::getName));
        for (java.lang.management.MemoryPoolMXBean p : pools) {
            MemoryUsage u = p.getUsage();
            if (u == null) continue;
            
            sb.append("Pool: ").append(p.getName()).append("\n");
            sb.append("  Type: ").append(p.getType()).append("\n");
            sb.append("  Used: ").append(formatBytes(u.getUsed())).append(" (" + u.getUsed() + " bytes)\n");
            sb.append("  Committed: ").append(formatBytes(u.getCommitted())).append(" (" + u.getCommitted() + " bytes)\n");
            sb.append("  Max: ").append(formatBytes(u.getMax())).append(" (" + u.getMax() + " bytes)\n");
            sb.append("  Init: ").append(formatBytes(u.getInit())).append(" (" + u.getInit() + " bytes)\n");
            
            if (u.getMax() > 0) {
                double poolPercent = u.getUsed() * 100.0 / u.getMax();
                sb.append("  Usage: ").append(String.format("%.2f", poolPercent)).append("%\n");
            }
            
            // Collection usage
            MemoryUsage cu = p.getCollectionUsage();
            if (cu != null) {
                sb.append("  Collection Used: ").append(formatBytes(cu.getUsed())).append("\n");
                sb.append("  Collection Committed: ").append(formatBytes(cu.getCommitted())).append("\n");
                sb.append("  Collection Max: ").append(formatBytes(cu.getMax())).append("\n");
            }
            
            // Peak usage
            MemoryUsage pu = p.getPeakUsage();
            if (pu != null) {
                sb.append("  Peak Used: ").append(formatBytes(pu.getUsed())).append("\n");
                sb.append("  Peak Committed: ").append(formatBytes(pu.getCommitted())).append("\n");
            }
            
            sb.append("\n");
        }
        
        // === Buffer Pools ===
        sb.append("=== Buffer Pools ===\n");
        try {
            Class<?> bufferPoolMXBeanClass = Class.forName("java.lang.management.BufferPoolMXBean");
            @SuppressWarnings("unchecked")
            List<Object> bufferPools = (List<Object>) ManagementFactory.getPlatformMXBeans((Class) bufferPoolMXBeanClass);
            for (Object bp : bufferPools) {
                String name = (String) bufferPoolMXBeanClass.getMethod("getName").invoke(bp);
                long count = (Long) bufferPoolMXBeanClass.getMethod("getCount").invoke(bp);
                long memoryUsed = (Long) bufferPoolMXBeanClass.getMethod("getMemoryUsed").invoke(bp);
                long totalCapacity = (Long) bufferPoolMXBeanClass.getMethod("getTotalCapacity").invoke(bp);
                
                sb.append("Buffer Pool: ").append(name).append("\n");
                sb.append("  Count: ").append(count).append("\n");
                sb.append("  Memory Used: ").append(formatBytes(memoryUsed)).append("\n");
                sb.append("  Total Capacity: ").append(formatBytes(totalCapacity)).append("\n");
                sb.append("\n");
            }
        } catch (Exception e) {
            sb.append("Buffer pools info not available\n\n");
        }
        
        return truncate(sb.toString());
    }

    private static String formatMem(MemoryUsage u) {
        if (u == null) return "";
        return "init=" + u.getInit() + " used=" + u.getUsed() + " committed=" + u.getCommitted() + " max=" + u.getMax();
    }

    /**
     * 格式化字节数为可读格式
     */
    private static String formatBytes(long bytes) {
        if (bytes < 0) return "N/A";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    /**
     * 格式化毫秒数为可读的时间格式
     */
    private static String formatDuration(long millis) {
        if (millis < 0) return "N/A";
        if (millis < 1000) return millis + " ms";
        long seconds = millis / 1000;
        if (seconds < 60) return String.format("%.2f s", millis / 1000.0);
        long minutes = seconds / 60;
        if (minutes < 60) return String.format("%d min %d s", minutes, seconds % 60);
        long hours = minutes / 60;
        return String.format("%d h %d min", hours, minutes % 60);
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

    /**
     * 读取 Agent 配置文件内容
     */
    private static String readConfigFile() {
        try {
            // 从系统属性获取配置文件路径
            String configPath = System.getProperty("lt.config");
            if (configPath == null || configPath.isEmpty()) {
                // 尝试从 ConfigUtils 获取
                configPath = ConfigUtils.me().getStr("lt.config.path");
            }
            
            if (configPath == null || configPath.isEmpty()) {
                return "# No config file path specified\n# Please set -Dlt.config=/path/to/config.yml";
            }
            
            java.io.File configFile = new java.io.File(configPath);
            if (!configFile.exists()) {
                return "# Config file not found: " + configPath;
            }
            
            if (!configFile.canRead()) {
                return "# Config file is not readable: " + configPath;
            }
            
            // 读取文件内容
            StringBuilder sb = new StringBuilder();
            java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.FileReader(configFile)
            );
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            reader.close();
            
            String content = sb.toString();
            if (content.trim().isEmpty()) {
                return "# Config file is empty: " + configPath;
            }
            
            return content;
        } catch (Exception e) {
            return "# Failed to read config file: " + e.getMessage();
        }
    }

    private static String truncate(String s) {
        int max = 200_000;
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max);
    }
}

