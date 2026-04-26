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
    
    @Autowired(required=false)
    private org.xi.lt.server.infrastructure.alert.engine.AlertEngine alertEngine;

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
                    Object metricsObj = getStringAsObject(props, "metrics");
                    if (props instanceof java.util.Map) {
                        log.info("[DIAG] Received heartbeat from agentId='{}', props keys: {}, metricsObj is null: {}, metricsObj class: {}", 
                            agentId, ((java.util.Map<?, ?>) props).keySet(), metricsObj == null, 
                            metricsObj != null ? metricsObj.getClass().getName() : "null");
                    } else {
                        log.info("[DIAG] Received heartbeat from agentId='{}', props class: {}, metricsObj is null: {}", 
                            agentId, props != null ? props.getClass().getName() : "null", metricsObj == null);
                    }
                    if (metricsObj != null) {
                        log.info("[DIAG] metricsObj type check - is Map: {}, is LinkedHashMap: {}", 
                            metricsObj instanceof java.util.Map, 
                            metricsObj instanceof java.util.LinkedHashMap);
                    }
                    if (metricsObj instanceof java.util.Map) {
                        log.info("[DIAG] metrics keys: {}", ((java.util.Map<?, ?>) metricsObj).keySet());
                        log.info("[DIAG] diskReadBytes value: {}, class: {}", 
                            ((java.util.Map<?, ?>) metricsObj).get("diskReadBytes"),
                            ((java.util.Map<?, ?>) metricsObj).get("diskReadBytes") != null ? 
                                ((java.util.Map<?, ?>) metricsObj).get("diskReadBytes").getClass().getName() : "null");
                    }
                    if (metricsObj != null && memoryHistoryRepository != null) {
                        org.xi.lt.server.domain.model.agent.AgentMemoryMetrics savedMetrics = saveMemoryMetrics(agentId, metricsObj);
                        log.info("[DIAG] saveMemoryMetrics result: {}", savedMetrics != null ? "success" : "null");
                        
                        // 触发告警检查
                        if (alertEngine != null && savedMetrics != null) {
                            alertEngine.checkMetrics(savedMetrics);
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to process memory metrics from heartbeat", e);
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
    
    private org.xi.lt.server.domain.model.agent.AgentMemoryMetrics saveMemoryMetrics(String agentId, Object metricsObj) {
        if (!(metricsObj instanceof java.util.Map)) return null;
        
        java.util.Map<String, Object> metrics = (java.util.Map<String, Object>) metricsObj;
        
        // 解析 agentId: 兼容 "app@env@inst" 和 "env_app_inst_suffix" 两种格式
        String appCode = "unknown";
        String instId = "unknown";
        
        String[] parts = agentId.split("@");
        if (parts.length >= 3) {
            appCode = parts[0];
            instId = parts[2];
        } else {
            // 兼容 Agent 实际发送的格式: dev_order_test01_0
            parts = agentId.split("_");
            if (parts.length >= 3) {
                // 格式: env_app_inst_suffix
                appCode = parts[1];
                instId = parts[2];
            }
        }
        
        log.info("[DIAG] Parsed agentId='{}' -> appCode='{}', instId='{}'", agentId, appCode, instId);
        
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
        
        // Phase 3: IO & Network metrics
        Long diskReadBytes = getLong(metrics, "diskReadBytes");
        Long diskWriteBytes = getLong(metrics, "diskWriteBytes");
        Long networkRecvBytes = getLong(metrics, "networkRecvBytes");
        Long networkSentBytes = getLong(metrics, "networkSentBytes");
        log.info("[DIAG] IO/Network metrics received - diskRead:{}, diskWrite:{}, networkRecv:{}, networkSent:{}, metrics keys: {}", 
                diskReadBytes, diskWriteBytes, networkRecvBytes, networkSentBytes, metrics.keySet());
        memoryMetrics.setDiskReadBytes(diskReadBytes);
        memoryMetrics.setDiskWriteBytes(diskWriteBytes);
        memoryMetrics.setNetworkRecvBytes(networkRecvBytes);
        memoryMetrics.setNetworkSentBytes(networkSentBytes);
        memoryMetrics.setDiskReadOps(getLong(metrics, "diskReadOps"));
        memoryMetrics.setDiskWriteOps(getLong(metrics, "diskWriteOps"));
        
        // Phase 4: Memory Pools Detail
        memoryMetrics.setEdenUsed(getLong(metrics, "edenUsed"));
        memoryMetrics.setEdenMax(getLong(metrics, "edenMax"));
        memoryMetrics.setSurvivorUsed(getLong(metrics, "survivorUsed"));
        memoryMetrics.setSurvivorMax(getLong(metrics, "survivorMax"));
        memoryMetrics.setOldGenUsed(getLong(metrics, "oldGenUsed"));
        memoryMetrics.setOldGenMax(getLong(metrics, "oldGenMax"));
        memoryMetrics.setMetaspaceUsed(getLong(metrics, "metaspaceUsed"));
        memoryMetrics.setMetaspaceMax(getLong(metrics, "metaspaceMax"));
        memoryMetrics.setCodeCacheUsed(getLong(metrics, "codeCacheUsed"));
        memoryMetrics.setCodeCacheMax(getLong(metrics, "codeCacheMax"));
        
        // Phase 4: GC Efficiency
        memoryMetrics.setGcReclaimedBytes(getLong(metrics, "gcReclaimedBytes"));
        memoryMetrics.setGcEfficiency(getDouble(metrics, "gcEfficiency"));
        
        // Phase 5: Advanced Monitoring
        memoryMetrics.setMemoryAllocationRate(getDouble(metrics, "memoryAllocationRate"));
        memoryMetrics.setGcReclaimedLastInterval(getLong(metrics, "gcReclaimedLastInterval"));
        memoryMetrics.setGcPressure(getDouble(metrics, "gcPressure"));
        
        // Phase 6: Comprehensive Monitoring
        memoryMetrics.setGcReclaimedBytesCurrent(getLong(metrics, "gcReclaimedBytesCurrent"));
        memoryMetrics.setCpuMemoryCorrelation(getDouble(metrics, "cpuMemoryCorrelation"));
        
        // Phase 7: Real-time Dashboard
        memoryMetrics.setTopCpuThreadName(getString(metrics, "topCpuThreadName"));
        memoryMetrics.setTopCpuThreadPercent(getDouble(metrics, "topCpuThreadPercent"));
        memoryMetrics.setThreadCountRunnable(getInt(metrics, "threadCountRunnable"));
        memoryMetrics.setThreadCountBlocked(getInt(metrics, "threadCountBlocked"));
        
        // Phase 8: Performance Dashboard
        memoryMetrics.setPerformanceScore(getDouble(metrics, "performanceScore"));
        memoryMetrics.setHealthStatus(getString(metrics, "healthStatus"));
        
        // Buffer Pools & Physical Memory
        Object bufferPoolsObj = metrics.get("bufferPools");
        if (bufferPoolsObj != null) {
            try {
                memoryMetrics.setBufferPools(bufferPoolsObj instanceof String ? (String) bufferPoolsObj : com.alibaba.fastjson.JSON.toJSONString(bufferPoolsObj));
            } catch (Exception e) {
                log.debug("Failed to serialize bufferPools: {}", e.getMessage());
            }
        }
        memoryMetrics.setTotalPhysicalMemory(getLong(metrics, "totalPhysicalMemory"));
        memoryMetrics.setFreePhysicalMemory(getLong(metrics, "freePhysicalMemory"));
        
        memoryHistoryRepository.save(memoryMetrics);
        
        return memoryMetrics;
    }
    
    private static Long getLong(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        // 兼容反序列化后的类型（如 BigDecimal, String 等）
        try {
            String str = String.valueOf(val).trim();
            if (str.isEmpty() || "null".equalsIgnoreCase(str)) return null;
            // 处理小数（如 "123.0"）
            if (str.contains(".")) {
                return new java.math.BigDecimal(str).longValue();
            }
            return Long.parseLong(str);
        } catch (Exception e) {
            log.warn("Failed to parse Long for key='{}', value={}, type={}", key, val, val.getClass().getName());
            return null;
        }
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
