package org.xi.lt.server.infrastructure.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.model.agent.AgentMemoryMetrics;
import org.xi.lt.server.domain.repository.AgentMemoryHistoryRepository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public class AgentMemoryHistoryRepositoryImpl implements AgentMemoryHistoryRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            // 强制删除旧表，确保下次启动时 schema-h2.sql 能创建最新结构的表
            jdbcTemplate.execute("DROP TABLE IF EXISTS agent_memory_history");
            System.out.println("[DIAG] Old agent_memory_history table dropped. Will be recreated by schema-h2.sql on next startup.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Override
    public void save(AgentMemoryMetrics metrics) {
        String sql = "INSERT INTO agent_memory_history " +
                    "(app_code, inst_id, collect_time, heap_used, heap_committed, heap_max, " +
                    "non_heap_used, non_heap_committed, non_heap_max, thread_count, " +
                    "peak_thread_count, daemon_thread_count, loaded_class_count, total_loaded_class_count, " +
                    "unloaded_class_count, class_loading_rate, gc_count, gc_time_ms, " +
                    "minor_gc_count, minor_gc_time_ms, full_gc_count, full_gc_time_ms, " +
                    "process_cpu_load, system_cpu_load, memory_pools, thread_states, jvm_start_time, " +
                    "top_cpu_threads, thread_pools, gc_snapshot, " +
                    "disk_read_bytes, disk_write_bytes, network_recv_bytes, network_sent_bytes, disk_read_ops, disk_write_ops, " +
                    "eden_used, eden_max, survivor_used, survivor_max, old_gen_used, old_gen_max, " +
                    "metaspace_used, metaspace_max, code_cache_used, code_cache_max, " +
                    "gc_reclaimed_bytes, gc_efficiency, memory_allocation_rate, gc_reclaimed_last_interval, gc_pressure, " +
                    "gc_reclaimed_bytes_current, cpu_memory_correlation, " +
                    "top_cpu_thread_name, top_cpu_thread_percent, thread_count_runnable, thread_count_blocked, " +
                    "performance_score, health_status) " +
                    "VALUES (" +
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + // 10
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + // 20
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + // 30
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + // 40
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + // 50
                    "?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +   // 60
                    ")";
        
        try {
            jdbcTemplate.update(sql,
                metrics.getAppCode(),
                metrics.getInstId(),
                new Timestamp(metrics.getCollectTime()),
                metrics.getHeapUsed(),
                metrics.getHeapCommitted(),
                metrics.getHeapMax(),
                metrics.getNonHeapUsed(),
                metrics.getNonHeapCommitted(),
                metrics.getNonHeapMax(),
                metrics.getThreadCount(),
                metrics.getPeakThreadCount(),
                metrics.getDaemonThreadCount(),
                metrics.getLoadedClassCount(),
                metrics.getTotalLoadedClassCount(),
                metrics.getUnloadedClassCount(),
                metrics.getClassLoadingRate(),
                metrics.getGcCount(),
                metrics.getGcTimeMs(),
                metrics.getMinorGcCount(),
                metrics.getMinorGcTimeMs(),
                metrics.getFullGcCount(),
                metrics.getFullGcTimeMs(),
                metrics.getProcessCpuLoad(),
                metrics.getSystemCpuLoad(),
                metrics.getMemoryPools(),
                metrics.getThreadStates(),
                metrics.getJvmStartTime(),
                metrics.getTopCpuThreads(),
                metrics.getThreadPools(),
                metrics.getGcSnapshot(),
                // Phase 3: IO & Network
                metrics.getDiskReadBytes(),
                metrics.getDiskWriteBytes(),
                metrics.getNetworkRecvBytes(),
                metrics.getNetworkSentBytes(),
                metrics.getDiskReadOps(),
                metrics.getDiskWriteOps(),
                // Phase 4: Memory Pools Detail
                metrics.getEdenUsed(),
                metrics.getEdenMax(),
                metrics.getSurvivorUsed(),
                metrics.getSurvivorMax(),
                metrics.getOldGenUsed(),
                metrics.getOldGenMax(),
                metrics.getMetaspaceUsed(),
                metrics.getMetaspaceMax(),
                metrics.getCodeCacheUsed(),
                metrics.getCodeCacheMax(),
                // Phase 4: GC Efficiency
                metrics.getGcReclaimedBytes(),
                metrics.getGcEfficiency(),
                // Phase 5: Advanced Monitoring
                metrics.getMemoryAllocationRate(),
                metrics.getGcReclaimedLastInterval(),
                metrics.getGcPressure(),
                // Phase 6: Comprehensive Monitoring
                metrics.getGcReclaimedBytesCurrent(),
                metrics.getCpuMemoryCorrelation(),
                // Phase 7: Real-time Dashboard
                metrics.getTopCpuThreadName(),
                metrics.getTopCpuThreadPercent(),
                metrics.getThreadCountRunnable(),
                metrics.getThreadCountBlocked(),
                // Phase 8: Performance Dashboard
                metrics.getPerformanceScore(),
                metrics.getHealthStatus()
            );
        } catch (Exception e) {
            System.err.println("Failed to save memory metrics: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @Override
    public List<AgentMemoryMetrics> queryHistory(String appCode, String instId, Long startTime, Long endTime, int limit) {
        StringBuilder sql = new StringBuilder(
            "SELECT app_code, inst_id, collect_time, heap_used, heap_committed, heap_max, " +
            "non_heap_used, non_heap_committed, non_heap_max, thread_count, " +
            "peak_thread_count, daemon_thread_count, loaded_class_count, total_loaded_class_count, " +
            "unloaded_class_count, class_loading_rate, gc_count, gc_time_ms, " +
            "minor_gc_count, minor_gc_time_ms, full_gc_count, full_gc_time_ms, " +
            "process_cpu_load, system_cpu_load, memory_pools, thread_states, jvm_start_time, " +
            "top_cpu_threads, thread_pools, gc_snapshot, " +
            "disk_read_bytes, disk_write_bytes, network_recv_bytes, network_sent_bytes, disk_read_ops, disk_write_ops, " +
            "eden_used, eden_max, survivor_used, survivor_max, old_gen_used, old_gen_max, " +
            "metaspace_used, metaspace_max, code_cache_used, code_cache_max, " +
            "gc_reclaimed_bytes, gc_efficiency, memory_allocation_rate, gc_reclaimed_last_interval, gc_pressure, " +
            "gc_reclaimed_bytes_current, cpu_memory_correlation, " +
            "top_cpu_thread_name, top_cpu_thread_percent, thread_count_runnable, thread_count_blocked, " +
            "performance_score, health_status " +
            "FROM agent_memory_history WHERE app_code = ? AND inst_id = ?"
        );
        
        if (startTime != null && endTime != null) {
            sql.append(" AND collect_time BETWEEN ? AND ?");
        }
        
        sql.append(" ORDER BY collect_time DESC LIMIT ?");
        
        Object[] params;
        if (startTime != null && endTime != null) {
            params = new Object[]{appCode, instId, new Timestamp(startTime), new Timestamp(endTime), limit};
        } else {
            params = new Object[]{appCode, instId, limit};
        }
        
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            AgentMemoryMetrics metrics = new AgentMemoryMetrics();
            metrics.setAppCode(rs.getString("app_code"));
            metrics.setInstId(rs.getString("inst_id"));
            metrics.setCollectTime(rs.getTimestamp("collect_time").getTime());
            metrics.setHeapUsed(rs.getLong("heap_used"));
            metrics.setHeapCommitted(rs.getLong("heap_committed"));
            metrics.setHeapMax(rs.getLong("heap_max"));
            metrics.setNonHeapUsed(rs.getLong("non_heap_used"));
            metrics.setNonHeapCommitted(rs.getLong("non_heap_committed"));
            metrics.setNonHeapMax(rs.getLong("non_heap_max"));
            metrics.setThreadCount(rs.getInt("thread_count"));
            
            int peakThreadCount = rs.getInt("peak_thread_count");
            metrics.setPeakThreadCount(rs.wasNull() ? null : peakThreadCount);
            
            int daemonThreadCount = rs.getInt("daemon_thread_count");
            metrics.setDaemonThreadCount(rs.wasNull() ? null : daemonThreadCount);
            
            metrics.setLoadedClassCount(rs.getInt("loaded_class_count"));
            
            long totalLoadedClassCount = rs.getLong("total_loaded_class_count");
            metrics.setTotalLoadedClassCount(rs.wasNull() ? null : totalLoadedClassCount);
            
            long unloadedClassCount = rs.getLong("unloaded_class_count");
            metrics.setUnloadedClassCount(rs.wasNull() ? null : unloadedClassCount);
            
            double classLoadingRate = rs.getDouble("class_loading_rate");
            metrics.setClassLoadingRate(rs.wasNull() ? null : classLoadingRate);
            
            metrics.setGcCount(rs.getLong("gc_count"));
            metrics.setGcTimeMs(rs.getLong("gc_time_ms"));
            
            long minorGcCount = rs.getLong("minor_gc_count");
            metrics.setMinorGcCount(rs.wasNull() ? null : minorGcCount);
            
            long minorGcTimeMs = rs.getLong("minor_gc_time_ms");
            metrics.setMinorGcTimeMs(rs.wasNull() ? null : minorGcTimeMs);
            
            long fullGcCount = rs.getLong("full_gc_count");
            metrics.setFullGcCount(rs.wasNull() ? null : fullGcCount);
            
            long fullGcTimeMs = rs.getLong("full_gc_time_ms");
            metrics.setFullGcTimeMs(rs.wasNull() ? null : fullGcTimeMs);
            
            double processCpuLoad = rs.getDouble("process_cpu_load");
            metrics.setProcessCpuLoad(rs.wasNull() ? null : processCpuLoad);
            
            double systemCpuLoad = rs.getDouble("system_cpu_load");
            metrics.setSystemCpuLoad(rs.wasNull() ? null : systemCpuLoad);
            
            metrics.setMemoryPools(rs.getString("memory_pools"));
            metrics.setThreadStates(rs.getString("thread_states"));
            
            long jvmStartTime = rs.getLong("jvm_start_time");
            metrics.setJvmStartTime(rs.wasNull() ? null : jvmStartTime);
            
            metrics.setTopCpuThreads(rs.getString("top_cpu_threads"));
            metrics.setThreadPools(rs.getString("thread_pools"));
            metrics.setGcSnapshot(rs.getString("gc_snapshot"));
            
            // Phase 3: IO & Network
            long diskReadBytes = rs.getLong("disk_read_bytes");
            metrics.setDiskReadBytes(rs.wasNull() ? null : diskReadBytes);
            
            long diskWriteBytes = rs.getLong("disk_write_bytes");
            metrics.setDiskWriteBytes(rs.wasNull() ? null : diskWriteBytes);
            
            long networkRecvBytes = rs.getLong("network_recv_bytes");
            metrics.setNetworkRecvBytes(rs.wasNull() ? null : networkRecvBytes);
            
            long networkSentBytes = rs.getLong("network_sent_bytes");
            metrics.setNetworkSentBytes(rs.wasNull() ? null : networkSentBytes);
            
            long diskReadOps = rs.getLong("disk_read_ops");
            metrics.setDiskReadOps(rs.wasNull() ? null : diskReadOps);
            
            long diskWriteOps = rs.getLong("disk_write_ops");
            metrics.setDiskWriteOps(rs.wasNull() ? null : diskWriteOps);
            
            // Phase 4: Memory Pools Detail
            long edenUsed = rs.getLong("eden_used");
            metrics.setEdenUsed(rs.wasNull() ? null : edenUsed);
            
            long edenMax = rs.getLong("eden_max");
            metrics.setEdenMax(rs.wasNull() ? null : edenMax);
            
            long survivorUsed = rs.getLong("survivor_used");
            metrics.setSurvivorUsed(rs.wasNull() ? null : survivorUsed);
            
            long survivorMax = rs.getLong("survivor_max");
            metrics.setSurvivorMax(rs.wasNull() ? null : survivorMax);
            
            long oldGenUsed = rs.getLong("old_gen_used");
            metrics.setOldGenUsed(rs.wasNull() ? null : oldGenUsed);
            
            long oldGenMax = rs.getLong("old_gen_max");
            metrics.setOldGenMax(rs.wasNull() ? null : oldGenMax);
            
            long metaspaceUsed = rs.getLong("metaspace_used");
            metrics.setMetaspaceUsed(rs.wasNull() ? null : metaspaceUsed);
            
            long metaspaceMax = rs.getLong("metaspace_max");
            metrics.setMetaspaceMax(rs.wasNull() ? null : metaspaceMax);
            
            long codeCacheUsed = rs.getLong("code_cache_used");
            metrics.setCodeCacheUsed(rs.wasNull() ? null : codeCacheUsed);
            
            long codeCacheMax = rs.getLong("code_cache_max");
            metrics.setCodeCacheMax(rs.wasNull() ? null : codeCacheMax);
            
            // Phase 4: GC Efficiency
            long gcReclaimedBytes = rs.getLong("gc_reclaimed_bytes");
            metrics.setGcReclaimedBytes(rs.wasNull() ? null : gcReclaimedBytes);
            
            double gcEfficiency = rs.getDouble("gc_efficiency");
            metrics.setGcEfficiency(rs.wasNull() ? null : gcEfficiency);
            
            // Phase 5: Advanced Monitoring
            double memoryAllocationRate = rs.getDouble("memory_allocation_rate");
            metrics.setMemoryAllocationRate(rs.wasNull() ? null : memoryAllocationRate);
            
            long gcReclaimedLastInterval = rs.getLong("gc_reclaimed_last_interval");
            metrics.setGcReclaimedLastInterval(rs.wasNull() ? null : gcReclaimedLastInterval);
            
            double gcPressure = rs.getDouble("gc_pressure");
            metrics.setGcPressure(rs.wasNull() ? null : gcPressure);
            
            // Phase 6: Comprehensive Monitoring
            long gcReclaimedBytesCurrent = rs.getLong("gc_reclaimed_bytes_current");
            metrics.setGcReclaimedBytesCurrent(rs.wasNull() ? null : gcReclaimedBytesCurrent);
            
            double cpuMemoryCorrelation = rs.getDouble("cpu_memory_correlation");
            metrics.setCpuMemoryCorrelation(rs.wasNull() ? null : cpuMemoryCorrelation);
            
            // Phase 7: Real-time Dashboard
            metrics.setTopCpuThreadName(rs.getString("top_cpu_thread_name"));
            
            double topCpuThreadPercent = rs.getDouble("top_cpu_thread_percent");
            metrics.setTopCpuThreadPercent(rs.wasNull() ? null : topCpuThreadPercent);
            
            int threadCountRunnable = rs.getInt("thread_count_runnable");
            metrics.setThreadCountRunnable(rs.wasNull() ? null : threadCountRunnable);
            
            int threadCountBlocked = rs.getInt("thread_count_blocked");
            metrics.setThreadCountBlocked(rs.wasNull() ? null : threadCountBlocked);
            
            // Phase 8: Performance Dashboard
            double performanceScore = rs.getDouble("performance_score");
            metrics.setPerformanceScore(rs.wasNull() ? null : performanceScore);
            
            metrics.setHealthStatus(rs.getString("health_status"));
            
            return metrics;
        });
    }
}
