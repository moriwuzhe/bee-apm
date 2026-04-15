package org.xi.lt.server.domain.model.core;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * Span 领域实体
 * APM追踪的核心领域对象
 * 
 * @author system
 * @date 2026/04/15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Span implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 唯一标识
     */
    private String id;
    
    /**
     * 追踪类型（span/log/metric等）
     */
    private String type;
    
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
    private Long time;
    
    /**
     * 耗时（毫秒）
     */
    private Long spend;
    
    /**
     * 标签信息
     */
    private Map<String, Object> tags;
    
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
