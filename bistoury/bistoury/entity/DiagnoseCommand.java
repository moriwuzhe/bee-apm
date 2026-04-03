package com.bistoury.entity;

import lombok.Data;
import java.util.Date;

/**
 * 诊断命令实体
 */
@Data
public class DiagnoseCommand {
    /**
     * 任务ID
     */
    private String taskId;

    /**
     * 目标Agent ID
     */
    private String agentId;

    /**
     * 命令类型：arthas/jvm/os等
     */
    private String commandType;

    /**
     * 命令内容
     */
    private String command;

    /**
     * 命令参数
     */
    private String[] args;

    /**
     * 执行状态：pending/running/success/failed
     */
    private String status;

    /**
     * 执行结果
     */
    private String result;

    /**
     * 提交时间
     */
    private Date submitTime;

    /**
     * 完成时间
     */
    private Date finishTime;

    /**
     * 耗时（毫秒）
     */
    private Long costTime;
}
