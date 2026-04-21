package org.xi.lt.server.domain.model.agent;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentMemoryMetrics {
    private String appCode;
    private String instId;
    private Long collectTime;
    
    // Heap Memory
    private Long heapUsed;
    private Long heapCommitted;
    private Long heapMax;
    
    // Non-Heap Memory
    private Long nonHeapUsed;
    private Long nonHeapCommitted;
    private Long nonHeapMax;
    
    // Thread & Class
    private Integer threadCount;
    private Integer peakThreadCount;
    private Integer daemonThreadCount;
    private Integer loadedClassCount;
    private Long totalLoadedClassCount;
    private Long unloadedClassCount;
    private Double classLoadingRate;
    
    // GC
    private Long gcCount;
    private Long gcTimeMs;
    private Long minorGcCount;
    private Long minorGcTimeMs;
    private Long fullGcCount;
    private Long fullGcTimeMs;
    
    // CPU
    private Double processCpuLoad;
    private Double systemCpuLoad;
    
    // Memory Pools (JSON string)
    private String memoryPools;
    
    // Thread States (JSON string)
    private String threadStates;
    
    // JVM Start Time
    private Long jvmStartTime;
    
    // Phase 2: Top CPU Threads (JSON string)
    private String topCpuThreads;
    
    // Phase 2: Thread Pools Info (JSON string)
    private String threadPools;
    
    // Phase 2: GC Snapshot (JSON string)
    private String gcSnapshot;
    
    // IO & Network (Phase 3)
    private Long diskReadBytes;
    private Long diskWriteBytes;
    private Long networkRecvBytes;
    private Long networkSentBytes;
    private Long diskReadOps;
    private Long diskWriteOps;
    
    // Memory Pools Detail (Phase 4)
    private Long edenUsed;
    private Long edenMax;
    private Long survivorUsed;
    private Long survivorMax;
    private Long oldGenUsed;
    private Long oldGenMax;
    private Long metaspaceUsed;
    private Long metaspaceMax;
    private Long codeCacheUsed;
    private Long codeCacheMax;
    
    // GC Efficiency (Phase 4)
    private Long gcReclaimedBytes;  // GC回收的内存量
    private Double gcEfficiency;    // GC效率 = reclaimed / gcTime
    
    // Advanced Monitoring (Phase 5)
    private Double memoryAllocationRate;  // 内存分配速率 (bytes/sec)
    private Long gcReclaimedLastInterval; // 上次间隔GC回收量
    private Double gcPressure;            // GC压力指数 (0-100)
    
    // Comprehensive Monitoring (Phase 6)
    private Long gcReclaimedBytesCurrent; // 当前GC回收量
    private Double cpuMemoryCorrelation;  // CPU与内存相关性指数
    
    // Real-time Dashboard (Phase 7)
    private String topCpuThreadName;      // Top CPU线程名
    private Double topCpuThreadPercent;   // Top CPU线程占用率
    private Integer threadCountRunnable;  // RUNNABLE状态线程数
    private Integer threadCountBlocked;   // BLOCKED状态线程数
    
    // Performance Dashboard (Phase 8)
    private Double performanceScore;      // 综合性能评分 (0-100)
    private String healthStatus;          // 健康状态 (HEALTHY/WARNING/CRITICAL)

    public String getAppCode() {
        return appCode;
    }

    public void setAppCode(String appCode) {
        this.appCode = appCode;
    }

    public String getInstId() {
        return instId;
    }

    public void setInstId(String instId) {
        this.instId = instId;
    }

    public Long getCollectTime() {
        return collectTime;
    }

    public void setCollectTime(Long collectTime) {
        this.collectTime = collectTime;
    }

    public Long getHeapUsed() {
        return heapUsed;
    }

    public void setHeapUsed(Long heapUsed) {
        this.heapUsed = heapUsed;
    }

    public Long getHeapCommitted() {
        return heapCommitted;
    }

    public void setHeapCommitted(Long heapCommitted) {
        this.heapCommitted = heapCommitted;
    }

    public Long getHeapMax() {
        return heapMax;
    }

    public void setHeapMax(Long heapMax) {
        this.heapMax = heapMax;
    }

    public Long getNonHeapUsed() {
        return nonHeapUsed;
    }

    public void setNonHeapUsed(Long nonHeapUsed) {
        this.nonHeapUsed = nonHeapUsed;
    }

    public Long getNonHeapCommitted() {
        return nonHeapCommitted;
    }

    public void setNonHeapCommitted(Long nonHeapCommitted) {
        this.nonHeapCommitted = nonHeapCommitted;
    }

    public Long getNonHeapMax() {
        return nonHeapMax;
    }

    public void setNonHeapMax(Long nonHeapMax) {
        this.nonHeapMax = nonHeapMax;
    }

    public Integer getThreadCount() {
        return threadCount;
    }

    public void setThreadCount(Integer threadCount) {
        this.threadCount = threadCount;
    }

    public Integer getLoadedClassCount() {
        return loadedClassCount;
    }

    public void setLoadedClassCount(Integer loadedClassCount) {
        this.loadedClassCount = loadedClassCount;
    }

    public Integer getPeakThreadCount() {
        return peakThreadCount;
    }

    public void setPeakThreadCount(Integer peakThreadCount) {
        this.peakThreadCount = peakThreadCount;
    }

    public Integer getDaemonThreadCount() {
        return daemonThreadCount;
    }

    public void setDaemonThreadCount(Integer daemonThreadCount) {
        this.daemonThreadCount = daemonThreadCount;
    }

    public Long getTotalLoadedClassCount() {
        return totalLoadedClassCount;
    }

    public void setTotalLoadedClassCount(Long totalLoadedClassCount) {
        this.totalLoadedClassCount = totalLoadedClassCount;
    }

    public Long getUnloadedClassCount() {
        return unloadedClassCount;
    }

    public void setUnloadedClassCount(Long unloadedClassCount) {
        this.unloadedClassCount = unloadedClassCount;
    }

    public Double getClassLoadingRate() {
        return classLoadingRate;
    }

    public void setClassLoadingRate(Double classLoadingRate) {
        this.classLoadingRate = classLoadingRate;
    }

    public Long getMinorGcCount() {
        return minorGcCount;
    }

    public void setMinorGcCount(Long minorGcCount) {
        this.minorGcCount = minorGcCount;
    }

    public Long getMinorGcTimeMs() {
        return minorGcTimeMs;
    }

    public void setMinorGcTimeMs(Long minorGcTimeMs) {
        this.minorGcTimeMs = minorGcTimeMs;
    }

    public Long getFullGcCount() {
        return fullGcCount;
    }

    public void setFullGcCount(Long fullGcCount) {
        this.fullGcCount = fullGcCount;
    }

    public Long getFullGcTimeMs() {
        return fullGcTimeMs;
    }

    public void setFullGcTimeMs(Long fullGcTimeMs) {
        this.fullGcTimeMs = fullGcTimeMs;
    }

    public Long getGcCount() {
        return gcCount;
    }

    public void setGcCount(Long gcCount) {
        this.gcCount = gcCount;
    }

    public Long getGcTimeMs() {
        return gcTimeMs;
    }

    public void setGcTimeMs(Long gcTimeMs) {
        this.gcTimeMs = gcTimeMs;
    }

    public Double getProcessCpuLoad() {
        return processCpuLoad;
    }

    public void setProcessCpuLoad(Double processCpuLoad) {
        this.processCpuLoad = processCpuLoad;
    }

    public Double getSystemCpuLoad() {
        return systemCpuLoad;
    }

    public void setSystemCpuLoad(Double systemCpuLoad) {
        this.systemCpuLoad = systemCpuLoad;
    }
    
    public String getMemoryPools() {
        return memoryPools;
    }

    public void setMemoryPools(String memoryPools) {
        this.memoryPools = memoryPools;
    }
    
    public String getThreadStates() {
        return threadStates;
    }

    public void setThreadStates(String threadStates) {
        this.threadStates = threadStates;
    }
    
    public Long getJvmStartTime() {
        return jvmStartTime;
    }

    public void setJvmStartTime(Long jvmStartTime) {
        this.jvmStartTime = jvmStartTime;
    }
    
    public String getTopCpuThreads() {
        return topCpuThreads;
    }

    public void setTopCpuThreads(String topCpuThreads) {
        this.topCpuThreads = topCpuThreads;
    }
    
    public String getThreadPools() {
        return threadPools;
    }

    public void setThreadPools(String threadPools) {
        this.threadPools = threadPools;
    }
    
    public String getGcSnapshot() {
        return gcSnapshot;
    }

    public void setGcSnapshot(String gcSnapshot) {
        this.gcSnapshot = gcSnapshot;
    }
    
    // IO & Network Getters/Setters
    public Long getDiskReadBytes() {
        return diskReadBytes;
    }

    public void setDiskReadBytes(Long diskReadBytes) {
        this.diskReadBytes = diskReadBytes;
    }

    public Long getDiskWriteBytes() {
        return diskWriteBytes;
    }

    public void setDiskWriteBytes(Long diskWriteBytes) {
        this.diskWriteBytes = diskWriteBytes;
    }

    public Long getNetworkRecvBytes() {
        return networkRecvBytes;
    }

    public void setNetworkRecvBytes(Long networkRecvBytes) {
        this.networkRecvBytes = networkRecvBytes;
    }

    public Long getNetworkSentBytes() {
        return networkSentBytes;
    }

    public void setNetworkSentBytes(Long networkSentBytes) {
        this.networkSentBytes = networkSentBytes;
    }

    public Long getDiskReadOps() {
        return diskReadOps;
    }

    public void setDiskReadOps(Long diskReadOps) {
        this.diskReadOps = diskReadOps;
    }

    public Long getDiskWriteOps() {
        return diskWriteOps;
    }

    public void setDiskWriteOps(Long diskWriteOps) {
        this.diskWriteOps = diskWriteOps;
    }
    
    // Memory Pools Detail Getters/Setters
    public Long getEdenUsed() { return edenUsed; }
    public void setEdenUsed(Long edenUsed) { this.edenUsed = edenUsed; }
    public Long getEdenMax() { return edenMax; }
    public void setEdenMax(Long edenMax) { this.edenMax = edenMax; }
    public Long getSurvivorUsed() { return survivorUsed; }
    public void setSurvivorUsed(Long survivorUsed) { this.survivorUsed = survivorUsed; }
    public Long getSurvivorMax() { return survivorMax; }
    public void setSurvivorMax(Long survivorMax) { this.survivorMax = survivorMax; }
    public Long getOldGenUsed() { return oldGenUsed; }
    public void setOldGenUsed(Long oldGenUsed) { this.oldGenUsed = oldGenUsed; }
    public Long getOldGenMax() { return oldGenMax; }
    public void setOldGenMax(Long oldGenMax) { this.oldGenMax = oldGenMax; }
    public Long getMetaspaceUsed() { return metaspaceUsed; }
    public void setMetaspaceUsed(Long metaspaceUsed) { this.metaspaceUsed = metaspaceUsed; }
    public Long getMetaspaceMax() { return metaspaceMax; }
    public void setMetaspaceMax(Long metaspaceMax) { this.metaspaceMax = metaspaceMax; }
    public Long getCodeCacheUsed() { return codeCacheUsed; }
    public void setCodeCacheUsed(Long codeCacheUsed) { this.codeCacheUsed = codeCacheUsed; }
    public Long getCodeCacheMax() { return codeCacheMax; }
    public void setCodeCacheMax(Long codeCacheMax) { this.codeCacheMax = codeCacheMax; }
    
    // GC Efficiency Getters/Setters
    public Long getGcReclaimedBytes() { return gcReclaimedBytes; }
    public void setGcReclaimedBytes(Long gcReclaimedBytes) { this.gcReclaimedBytes = gcReclaimedBytes; }
    public Double getGcEfficiency() { return gcEfficiency; }
    public void setGcEfficiency(Double gcEfficiency) { this.gcEfficiency = gcEfficiency; }
    
    // Advanced Monitoring (Phase 5) Getters/Setters
    public Double getMemoryAllocationRate() { return memoryAllocationRate; }
    public void setMemoryAllocationRate(Double memoryAllocationRate) { this.memoryAllocationRate = memoryAllocationRate; }
    public Long getGcReclaimedLastInterval() { return gcReclaimedLastInterval; }
    public void setGcReclaimedLastInterval(Long gcReclaimedLastInterval) { this.gcReclaimedLastInterval = gcReclaimedLastInterval; }
    public Double getGcPressure() { return gcPressure; }
    public void setGcPressure(Double gcPressure) { this.gcPressure = gcPressure; }
    
    // Comprehensive Monitoring (Phase 6) Getters/Setters
    public Long getGcReclaimedBytesCurrent() { return gcReclaimedBytesCurrent; }
    public void setGcReclaimedBytesCurrent(Long gcReclaimedBytesCurrent) { this.gcReclaimedBytesCurrent = gcReclaimedBytesCurrent; }
    public Double getCpuMemoryCorrelation() { return cpuMemoryCorrelation; }
    public void setCpuMemoryCorrelation(Double cpuMemoryCorrelation) { this.cpuMemoryCorrelation = cpuMemoryCorrelation; }
    
    // Real-time Dashboard (Phase 7) Getters/Setters
    public String getTopCpuThreadName() { return topCpuThreadName; }
    public void setTopCpuThreadName(String topCpuThreadName) { this.topCpuThreadName = topCpuThreadName; }
    public Double getTopCpuThreadPercent() { return topCpuThreadPercent; }
    public void setTopCpuThreadPercent(Double topCpuThreadPercent) { this.topCpuThreadPercent = topCpuThreadPercent; }
    public Integer getThreadCountRunnable() { return threadCountRunnable; }
    public void setThreadCountRunnable(Integer threadCountRunnable) { this.threadCountRunnable = threadCountRunnable; }
    public Integer getThreadCountBlocked() { return threadCountBlocked; }
    public void setThreadCountBlocked(Integer threadCountBlocked) { this.threadCountBlocked = threadCountBlocked; }
    
    // Performance Dashboard (Phase 8) Getters/Setters
    public Double getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(Double performanceScore) { this.performanceScore = performanceScore; }
    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }
}
