package org.xi.lt.server.domain.model.core;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * Alert 领域实体
 * 告警事件的核心领域对象
 * 
 * @author system
 * @date 2026/04/15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 唯一标识
     */
    private String id;
    
    /**
     * 时间戳（毫秒）
     */
    private Long time;
    
    /**
     * 应用名称
     */
    private String app;
    
    /**
     * URL地址
     */
    private String url;
    
    /**
     * 全局追踪ID
     */
    private String gid;
    
    /**
     * 告警类型
     */
    private String alertType;
    
    /**
     * 告警消息
     */
    private String message;
    
    /**
     * 告警状态（NEW/ACKNOWLEDGED/RESOLVED）
     */
    private String status;
    
    /**
     * 环境标识
     */
    private String env;
    
    /**
     * IP地址
     */
    private String ip;
}
