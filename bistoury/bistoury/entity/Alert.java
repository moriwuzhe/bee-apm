package com.bistoury.entity;

import lombok.Data;
import java.util.Date;

/**
 * 告警实体类
 */
@Data
public class Alert {
    /**
     * 告警ID
     */
    private String id;

    /**
     * 告警级别：info/warning/error/critical
     */
    private String level;

    /**
     * 告警类型：jvm/thread/process/network/custom
     */
    private String type;

    /**
     * 告警标题
     */
    private String title;

    /**
     * 告警内容
     */
    private String content;

    /**
     * 关联的Agent ID
     */
    private String agentId;

    /**
     * 关联的应用名称
     */
    private String appName;

    /**
     * 告警状态：pending/processing/resolved/ignored
     */
    private String status;

    /**
     * 告警时间
     */
    private Date alertTime;

    /**
     * 处理时间
     */
    private Date resolveTime;

    /**
     * 处理人
     */
    private String resolveUser;

    /**
     * 处理备注
     */
    private String remark;

    /**
     * 标签，用于分类筛选
     */
    private String[] tags;
}
