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
    
    @Override
    public void save(AgentMemoryMetrics metrics) {
        String sql = "INSERT INTO agent_memory_history " +
                    "(app_code, inst_id, collect_time, heap_used, heap_committed, heap_max, " +
                    "non_heap_used, non_heap_committed, non_heap_max, thread_count, " +
                    "peak_thread_count, daemon_thread_count, loaded_class_count, total_loaded_class_count, " +
                    "unloaded_class_count, gc_count, gc_time_ms, " +
                    "minor_gc_count, minor_gc_time_ms, full_gc_count, full_gc_time_ms, " +
                    "process_cpu_load, system_cpu_load, memory_pools, thread_states, jvm_start_time, " +
                    "top_cpu_threads, thread_pools, gc_snapshot) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
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
                metrics.getGcSnapshot()
            );
        } catch (Exception e) {
            // 静默失败，避免影响主流程
            System.err.println("Failed to save memory metrics: " + e.getMessage());
        }
    }
    
    @Override
    public List<AgentMemoryMetrics> queryHistory(String appCode, String instId, Long startTime, Long endTime, int limit) {
        StringBuilder sql = new StringBuilder(
            "SELECT app_code, inst_id, collect_time, heap_used, heap_committed, heap_max, " +
            "non_heap_used, non_heap_committed, non_heap_max, thread_count, " +
            "peak_thread_count, daemon_thread_count, loaded_class_count, total_loaded_class_count, " +
            "unloaded_class_count, gc_count, gc_time_ms, " +
            "minor_gc_count, minor_gc_time_ms, full_gc_count, full_gc_time_ms, " +
            "process_cpu_load, system_cpu_load, memory_pools, thread_states, jvm_start_time, " +
            "top_cpu_threads, thread_pools, gc_snapshot " +
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
            
            return metrics;
        });
    }
}
