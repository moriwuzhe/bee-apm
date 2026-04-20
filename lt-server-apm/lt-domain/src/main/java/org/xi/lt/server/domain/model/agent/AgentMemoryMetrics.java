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
}
