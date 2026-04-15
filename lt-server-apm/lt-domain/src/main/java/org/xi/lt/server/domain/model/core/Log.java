package org.xi.lt.server.domain.model.core;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * Log 领域实体
 * 日志事件的核心领域对象
 * 
 * @author system
 * @date 2026/04/15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Log implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 唯一标识
     */
    private String id;
    
    /**
     * 关联的Span ID
     */
    private String spanId;
    
    /**
     * 全局追踪ID
     */
    private String gid;
    
    /**
     * 应用名称
     */
    private String app;
    
    /**
     * 实例标识
     */
    private String inst;
    
    /**
     * 时间戳（毫秒）
     */
    private Long timestamp;
    
    /**
     * 日志级别（INFO/WARN/ERROR等）
     */
    private String level;
    
    /**
     * 日志消息
     */
    private String message;
    
    /**
     * 日志字段
     */
    private Map<String, Object> fields;
    
    /**
     * 原始数据JSON
     */
    private String rawData;
    
    /**
     * 环境标识
     */
    private String env;
    
    /**
     * IP地址
     */
    private String ip;
}
