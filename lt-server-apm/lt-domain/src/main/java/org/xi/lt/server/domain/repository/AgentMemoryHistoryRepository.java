package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.agent.AgentMemoryMetrics;
import java.util.List;

public interface AgentMemoryHistoryRepository {
    /**
     * 保存内存指标数据
     */
    void save(AgentMemoryMetrics metrics);
    
    /**
     * 查询指定时间范围内的内存历史数据
     */
    List<AgentMemoryMetrics> queryHistory(String appCode, String instId, Long startTime, Long endTime, int limit);
}
