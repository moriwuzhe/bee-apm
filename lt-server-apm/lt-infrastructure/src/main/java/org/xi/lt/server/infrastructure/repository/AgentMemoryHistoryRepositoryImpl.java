package org.xi.lt.server.infrastructure.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.model.agent.AgentMemoryMetrics;
import org.xi.lt.server.domain.repository.AgentMemoryHistoryRepository;

import javax.annotation.PostConstruct;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class AgentMemoryHistoryRepositoryImpl implements AgentMemoryHistoryRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            // 查询数据库中该表实际的列数
            Integer columnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AGENT_MEMORY_HISTORY'", 
                Integer.class
            );
            System.out.println("[DIAG-DB] Actual columns in agent_memory_history table: " + columnCount);
            
            // 查询具体的列名
            List<String> columns = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AGENT_MEMORY_HISTORY' ORDER BY ORDINAL_POSITION",
                String.class
            );
            System.out.println("[DIAG-DB] Columns in DB: " + columns);
            System.out.println("[DIAG-DB] Total DB columns: " + columns.size());
            
            // 对比Java代码中的字段
            String[] javaFields = {
                "app_code", "inst_id", "collect_time", "heap_used", "heap_committed", "heap_max",
                "non_heap_used", "non_heap_committed", "non_heap_max", "thread_count",
                "peak_thread_count", "daemon_thread_count", "loaded_class_count", "total_loaded_class_count",
                "unloaded_class_count", "class_loading_rate", "gc_count", "gc_time_ms",
                "minor_gc_count", "minor_gc_time_ms", "full_gc_count", "full_gc_time_ms",
                "process_cpu_load", "system_cpu_load", "memory_pools", "thread_states", "jvm_start_time",
                "top_cpu_threads", "thread_pools", "gc_snapshot",
                "disk_read_bytes", "disk_write_bytes", "network_recv_bytes", "network_sent_bytes", "disk_read_ops", "disk_write_ops",
                "eden_used", "eden_max", "survivor_used", "survivor_max", "old_gen_used", "old_gen_max",
                "metaspace_used", "metaspace_max", "code_cache_used", "code_cache_max",
                "gc_reclaimed_bytes", "gc_efficiency", "memory_allocation_rate", "gc_reclaimed_last_interval", "gc_pressure",
                "gc_reclaimed_bytes_current", "cpu_memory_correlation",
                "top_cpu_thread_name", "top_cpu_thread_percent", "thread_count_runnable", "thread_count_blocked",
                "performance_score", "health_status",
                "buffer_pools", "total_physical_memory", "free_physical_memory"
            };
            System.out.println("[DIAG-DB] Java fields count: " + javaFields.length);
            
            // 找出DB中有但Java中没有的列
            java.util.Set<String> javaFieldSet = new java.util.HashSet<>(java.util.Arrays.asList(javaFields));
            javaFieldSet.add("id"); // 添加自增主键
            for (String dbCol : columns) {
                if (!javaFieldSet.contains(dbCol.toLowerCase())) {
                    System.err.println("[DIAG-DB] WARNING: DB has extra column: " + dbCol);
                }
            }
        } catch (Exception e) {
            System.err.println("[DIAG-DB] Failed to check table structure: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @Override
    public void save(AgentMemoryMetrics metrics) {
        // 动态获取数据库表的列名（排除ID自增列）
        try {
            java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection();
            java.sql.DatabaseMetaData metaData = conn.getMetaData();
            java.sql.ResultSet rs = metaData.getColumns(null, null, "AGENT_MEMORY_HISTORY", null);
            
            java.util.List<String> dbColumns = new java.util.ArrayList<>();
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                if (!"ID".equalsIgnoreCase(columnName)) { // 排除自增主键
                    dbColumns.add(columnName.toLowerCase());
                }
            }
            rs.close();
            conn.close();
            
            System.out.println("[DIAG-SQL] DB columns (excluding ID): " + dbColumns.size());
            System.out.println("[DIAG-SQL] Columns: " + dbColumns);
            
            // 使用数据库实际列名构建SQL
            String[] fields = dbColumns.toArray(new String[0]);
            String placeholders = String.join(", ", java.util.Collections.nCopies(fields.length, "?"));
            String sql = "INSERT INTO agent_memory_history (" + String.join(", ", fields) + ") VALUES (" + placeholders + ")";
            
            System.out.println("[DIAG-SQL] Generated SQL with " + fields.length + " fields");
            
            // 按数据库列顺序构建参数数组
            Object[] params = new Object[fields.length];
            for (int i = 0; i < fields.length; i++) {
                String col = fields[i];
                switch (col) {
                    case "app_code": params[i] = metrics.getAppCode(); break;
                    case "inst_id": params[i] = metrics.getInstId(); break;
                    case "collect_time": params[i] = new Timestamp(metrics.getCollectTime()); break;
                    case "heap_used": params[i] = metrics.getHeapUsed(); break;
                    case "heap_committed": params[i] = metrics.getHeapCommitted(); break;
                    case "heap_max": params[i] = metrics.getHeapMax(); break;
                    case "non_heap_used": params[i] = metrics.getNonHeapUsed(); break;
                    case "non_heap_committed": params[i] = metrics.getNonHeapCommitted(); break;
                    case "non_heap_max": params[i] = metrics.getNonHeapMax(); break;
                    case "thread_count": params[i] = metrics.getThreadCount(); break;
                    case "peak_thread_count": params[i] = metrics.getPeakThreadCount(); break;
                    case "daemon_thread_count": params[i] = metrics.getDaemonThreadCount(); break;
                    case "loaded_class_count": params[i] = metrics.getLoadedClassCount(); break;
                    case "total_loaded_class_count": params[i] = metrics.getTotalLoadedClassCount(); break;
                    case "unloaded_class_count": params[i] = metrics.getUnloadedClassCount(); break;
                    case "class_loading_rate": params[i] = metrics.getClassLoadingRate(); break;
                    case "gc_count": params[i] = metrics.getGcCount(); break;
                    case "gc_time_ms": params[i] = metrics.getGcTimeMs(); break;
                    case "minor_gc_count": params[i] = metrics.getMinorGcCount(); break;
                    case "minor_gc_time_ms": params[i] = metrics.getMinorGcTimeMs(); break;
                    case "full_gc_count": params[i] = metrics.getFullGcCount(); break;
                    case "full_gc_time_ms": params[i] = metrics.getFullGcTimeMs(); break;
                    case "process_cpu_load": params[i] = metrics.getProcessCpuLoad(); break;
                    case "system_cpu_load": params[i] = metrics.getSystemCpuLoad(); break;
                    case "memory_pools": params[i] = metrics.getMemoryPools(); break;
                    case "thread_states": params[i] = metrics.getThreadStates(); break;
                    case "jvm_start_time": params[i] = metrics.getJvmStartTime(); break;
                    case "top_cpu_threads": params[i] = metrics.getTopCpuThreads(); break;
                    case "thread_pools": params[i] = metrics.getThreadPools(); break;
                    case "gc_snapshot": params[i] = metrics.getGcSnapshot(); break;
                    case "disk_read_bytes": params[i] = metrics.getDiskReadBytes(); break;
                    case "disk_write_bytes": params[i] = metrics.getDiskWriteBytes(); break;
                    case "network_recv_bytes": params[i] = metrics.getNetworkRecvBytes(); break;
                    case "network_sent_bytes": params[i] = metrics.getNetworkSentBytes(); break;
                    case "disk_read_ops": params[i] = metrics.getDiskReadOps(); break;
                    case "disk_write_ops": params[i] = metrics.getDiskWriteOps(); break;
                    case "eden_used": params[i] = metrics.getEdenUsed(); break;
                    case "eden_max": params[i] = metrics.getEdenMax(); break;
                    case "survivor_used": params[i] = metrics.getSurvivorUsed(); break;
                    case "survivor_max": params[i] = metrics.getSurvivorMax(); break;
                    case "old_gen_used": params[i] = metrics.getOldGenUsed(); break;
                    case "old_gen_max": params[i] = metrics.getOldGenMax(); break;
                    case "metaspace_used": params[i] = metrics.getMetaspaceUsed(); break;
                    case "metaspace_max": params[i] = metrics.getMetaspaceMax(); break;
                    case "code_cache_used": params[i] = metrics.getCodeCacheUsed(); break;
                    case "code_cache_max": params[i] = metrics.getCodeCacheMax(); break;
                    case "gc_reclaimed_bytes": params[i] = metrics.getGcReclaimedBytes(); break;
                    case "gc_efficiency": params[i] = metrics.getGcEfficiency(); break;
                    case "memory_allocation_rate": params[i] = metrics.getMemoryAllocationRate(); break;
                    case "gc_reclaimed_last_interval": params[i] = metrics.getGcReclaimedLastInterval(); break;
                    case "gc_pressure": params[i] = metrics.getGcPressure(); break;
                    case "gc_reclaimed_bytes_current": params[i] = metrics.getGcReclaimedBytesCurrent(); break;
                    case "cpu_memory_correlation": params[i] = metrics.getCpuMemoryCorrelation(); break;
                    case "top_cpu_thread_name": params[i] = metrics.getTopCpuThreadName(); break;
                    case "top_cpu_thread_percent": params[i] = metrics.getTopCpuThreadPercent(); break;
                    case "thread_count_runnable": params[i] = metrics.getThreadCountRunnable(); break;
                    case "thread_count_blocked": params[i] = metrics.getThreadCountBlocked(); break;
                    case "performance_score": params[i] = metrics.getPerformanceScore(); break;
                    case "health_status": params[i] = metrics.getHealthStatus(); break;
                    case "buffer_pools": params[i] = metrics.getBufferPools(); break;
                    case "total_physical_memory": params[i] = metrics.getTotalPhysicalMemory(); break;
                    case "free_physical_memory": params[i] = metrics.getFreePhysicalMemory(); break;
                    default: 
                        System.err.println("[DIAG-SQL] WARNING: Unknown column: " + col);
                        params[i] = null;
                }
            }
            
            System.out.println("[DIAG-SQL] Total params: " + params.length);
            
            jdbcTemplate.update(sql, params);
            System.out.println("[DIAG-SQL] Save successful for: " + metrics.getAppCode());
        } catch (Exception e) {
            System.err.println("[DIAG-SQL] Failed to save. Error: " + e.getMessage());
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
            "performance_score, health_status, " +
            "buffer_pools, total_physical_memory, free_physical_memory " +
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
            
            // Buffer Pools & Physical Memory
            metrics.setBufferPools(rs.getString("buffer_pools"));
            
            long totalPhysicalMemory = rs.getLong("total_physical_memory");
            metrics.setTotalPhysicalMemory(rs.wasNull() ? null : totalPhysicalMemory);
            
            long freePhysicalMemory = rs.getLong("free_physical_memory");
            metrics.setFreePhysicalMemory(rs.wasNull() ? null : freePhysicalMemory);
            
            return metrics;
        });
    }
}
