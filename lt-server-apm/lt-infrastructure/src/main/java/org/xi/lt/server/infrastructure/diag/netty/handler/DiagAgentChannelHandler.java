package org.xi.lt.server.infrastructure.diag.netty.handler;

import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.xi.lt.server.core.util.ObjectFieldUtils;
import org.xi.lt.server.infrastructure.diag.netty.AgentCommandService;
import org.xi.lt.server.infrastructure.diag.netty.AgentConnectionStore;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.Datagram;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.RemotingBuilder;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.payload.RawStringPayloadHolder;
import org.xi.lt.server.domain.repository.ProjectRepository;
import org.xi.lt.server.domain.model.config.Project;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@ChannelHandler.Sharable
public class DiagAgentChannelHandler extends SimpleChannelInboundHandler<Datagram> {
    private static final Logger log = LoggerFactory.getLogger(DiagAgentChannelHandler.class);
    private static final int HEARTBEAT_CODE = 0;
    private static final int COMMAND_RESPONSE_CODE = 1001;

    @Autowired
    private AgentConnectionStore store;

    @Autowired
    private AgentCommandService commandService;

    @Autowired(required=false)
    private ProjectRepository projectRepository;
    
    @Autowired(required=false)
    private org.xi.lt.server.domain.repository.AgentMemoryHistoryRepository memoryHistoryRepository;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Datagram msg) {
        try {
            int code = msg.getHeader() == null ? -1 : msg.getHeader().getCode();
            if (code == HEARTBEAT_CODE) {
                String agentId = readAgentId(msg.getBody(), ctx.channel());
                int version = msg.getHeader().getAgentVersion();
                
                // 鉴权拦截: 验证 projectCode 和 secretKey
                Object props = msg.getHeader().getProperties();
                String projectCode = getString(props, "lt.project");
                String secretKey = getString(props, "lt.secret");

                if (projectCode == null || projectCode.isEmpty() || secretKey == null || secretKey.isEmpty()) {
                    log.warn("Agent Connection Rejected: missing project or secret. AgentId: {}", agentId);
                    ctx.close();
                    return;
                }

                if (projectRepository != null) {
                    Project project = projectRepository.findByProjectCode(projectCode);
                    if (project == null || !secretKey.equals(project.getSecretKey())) {
                        log.warn("Agent Connection Rejected: invalid project or secret. AgentId: {}, Project: {}", agentId, projectCode);
                        ctx.close();
                        return;
                    }
                }

                store.register(agentId, version, ctx.channel());
                
                // 处理内存指标数据
                try {
                    Object metrics = getStringAsObject(props, "metrics");
                    if (metrics != null && memoryHistoryRepository != null) {
                        saveMemoryMetrics(agentId, metrics);
                    }
                } catch (Exception e) {
                    log.debug("Failed to process memory metrics from heartbeat: {}", e.getMessage());
                }
                
                ctx.channel().writeAndFlush(RemotingBuilder.buildRequestDatagram(HEARTBEAT_CODE, UUID.randomUUID().toString(), new RawStringPayloadHolder("")));
                return;
            }
            if (code == COMMAND_RESPONSE_CODE) {
                commandService.onDatagram(msg);
                return;
            }
        } finally {
            msg.release();
        }
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        store.remove(ctx.channel());
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.warn("diag agent channel error, remote={}", ctx.channel().remoteAddress(), cause);
        ctx.close();
    }

    private String readAgentId(ByteBuf body, Channel channel) {
        if (body != null && body.isReadable()) {
            String s = body.toString(StandardCharsets.UTF_8);
            if (s != null && !s.trim().isEmpty()) {
                return s.trim();
            }
        }
        InetSocketAddress address = (InetSocketAddress) channel.remoteAddress();
        return address.getAddress().getHostAddress();
    }

    private static String getString(Object obj, String key) {
        if (obj == null || key == null) return null;
        if (obj instanceof java.util.Map) {
            Object val = ((java.util.Map) obj).get(key);
            return val != null ? String.valueOf(val) : null;
        }
        try {
            java.lang.reflect.Field field = obj.getClass().getDeclaredField(key);
            field.setAccessible(true);
            Object val = field.get(obj);
            return val != null ? String.valueOf(val) : null;
        } catch (Exception ignored) {
            return null;
        }
    }
    
    private static Object getStringAsObject(Object obj, String key) {
        if (obj == null || key == null) return null;
        if (obj instanceof java.util.Map) {
            return ((java.util.Map) obj).get(key);
        }
        return null;
    }
    
    private void saveMemoryMetrics(String agentId, Object metricsObj) {
        if (!(metricsObj instanceof java.util.Map)) return;
        
        java.util.Map<String, Object> metrics = (java.util.Map<String, Object>) metricsObj;
        
        // 解析 agentId: app@env@inst@ip:port
        String[] parts = agentId.split("@");
        if (parts.length < 3) return;
        
        String appCode = parts[0];
        String instId = parts.length >= 3 ? parts[2] : "unknown";
        
        org.xi.lt.server.domain.model.agent.AgentMemoryMetrics memoryMetrics = 
            new org.xi.lt.server.domain.model.agent.AgentMemoryMetrics();
        
        memoryMetrics.setAppCode(appCode);
        memoryMetrics.setInstId(instId);
        memoryMetrics.setCollectTime(getLong(metrics, "collectTime", System.currentTimeMillis()));
        memoryMetrics.setHeapUsed(getLong(metrics, "heapUsed"));
        memoryMetrics.setHeapCommitted(getLong(metrics, "heapCommitted"));
        memoryMetrics.setHeapMax(getLong(metrics, "heapMax"));
        memoryMetrics.setNonHeapUsed(getLong(metrics, "nonHeapUsed"));
        memoryMetrics.setNonHeapCommitted(getLong(metrics, "nonHeapCommitted"));
        memoryMetrics.setNonHeapMax(getLong(metrics, "nonHeapMax"));
        memoryMetrics.setThreadCount(getInt(metrics, "threadCount"));
        memoryMetrics.setPeakThreadCount(getInt(metrics, "peakThreadCount"));
        memoryMetrics.setDaemonThreadCount(getInt(metrics, "daemonThreadCount"));
        memoryMetrics.setLoadedClassCount(getInt(metrics, "loadedClassCount"));
        memoryMetrics.setTotalLoadedClassCount(getLong(metrics, "totalLoadedClassCount"));
        memoryMetrics.setUnloadedClassCount(getLong(metrics, "unloadedClassCount"));
        
        Double classLoadingRate = getDouble(metrics, "classLoadingRate");
        log.info("[DIAG] Received classLoadingRate from agent: {}, metrics keys: {}", classLoadingRate, metrics.keySet());
        memoryMetrics.setClassLoadingRate(classLoadingRate);
        memoryMetrics.setGcCount(getLong(metrics, "gcCount"));
        memoryMetrics.setGcTimeMs(getLong(metrics, "gcTimeMs"));
        
        // Minor/Full GC区分
        memoryMetrics.setMinorGcCount(getLong(metrics, "minorGcCount"));
        memoryMetrics.setMinorGcTimeMs(getLong(metrics, "minorGcTimeMs"));
        memoryMetrics.setFullGcCount(getLong(metrics, "fullGcCount"));
        memoryMetrics.setFullGcTimeMs(getLong(metrics, "fullGcTimeMs"));
        
        memoryMetrics.setProcessCpuLoad(getDouble(metrics, "processCpuLoad"));
        memoryMetrics.setSystemCpuLoad(getDouble(metrics, "systemCpuLoad"));
        
        // Convert pools to JSON string
        Object poolsObj = metrics.get("pools");
        if (poolsObj != null) {
            try {
                memoryMetrics.setMemoryPools(com.alibaba.fastjson.JSON.toJSONString(poolsObj));
            } catch (Exception e) {
                log.debug("Failed to serialize pools: {}", e.getMessage());
            }
        }
        
        // Convert threadStates to JSON string
        Object threadStatesObj = metrics.get("threadStates");
        if (threadStatesObj != null) {
            try {
                memoryMetrics.setThreadStates(com.alibaba.fastjson.JSON.toJSONString(threadStatesObj));
            } catch (Exception e) {
                log.debug("Failed to serialize threadStates: {}", e.getMessage());
            }
        }
        
        // JVM Start Time
        memoryMetrics.setJvmStartTime(getLong(metrics, "jvmStartTime"));
        
        // Phase 2: Convert topCpuThreads to JSON string
        Object topCpuThreadsObj = metrics.get("topCpuThreads");
        if (topCpuThreadsObj != null) {
            try {
                memoryMetrics.setTopCpuThreads(com.alibaba.fastjson.JSON.toJSONString(topCpuThreadsObj));
            } catch (Exception e) {
                log.debug("Failed to serialize topCpuThreads: {}", e.getMessage());
            }
        }
        
        // Phase 2: Convert threadPools to JSON string
        Object threadPoolsObj = metrics.get("threadPools");
        if (threadPoolsObj != null) {
            try {
                memoryMetrics.setThreadPools(com.alibaba.fastjson.JSON.toJSONString(threadPoolsObj));
            } catch (Exception e) {
                log.debug("Failed to serialize threadPools: {}", e.getMessage());
            }
        }
        
        // Phase 2: Convert gcSnapshot to JSON string
        Object gcSnapshotObj = metrics.get("gcSnapshot");
        if (gcSnapshotObj != null) {
            try {
                memoryMetrics.setGcSnapshot(com.alibaba.fastjson.JSON.toJSONString(gcSnapshotObj));
            } catch (Exception e) {
                log.debug("Failed to serialize gcSnapshot: {}", e.getMessage());
            }
        }
        
        memoryHistoryRepository.save(memoryMetrics);
    }
    
    private static Long getLong(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return Long.parseLong(String.valueOf(val)); } catch (Exception e) { return null; }
    }
    
    private static Long getLong(java.util.Map<String, Object> map, String key, Long defaultValue) {
        Long val = getLong(map, key);
        return val != null ? val : defaultValue;
    }
    
    private static Integer getInt(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(String.valueOf(val)); } catch (Exception e) { return null; }
    }
    
    private static Double getDouble(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(String.valueOf(val)); } catch (Exception e) { return null; }
    }
}
