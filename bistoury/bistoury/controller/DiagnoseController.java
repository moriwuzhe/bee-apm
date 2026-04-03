package com.bistoury.controller;

import com.bistoury.entity.DiagnoseCommand;
import com.bistoury.service.AgentService;
import com.bistoury.service.AiDiagnoseService;
import com.bistoury.service.WebSocketService;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.Date;
import java.util.UUID;

/**
 * 诊断中心控制器
 */
@RestController
@RequestMapping("/api/diagnose")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DiagnoseController {

    @Resource
    private AgentService agentService;

    @Resource
    private WebSocketService webSocketService;

    @Resource
    private AiDiagnoseService aiDiagnoseService;

    /**
     * 提交诊断命令
     */
    @PostMapping("/command")
    public String executeCommand(@RequestBody DiagnoseCommand command) {
        // 生成任务ID
        String taskId = UUID.randomUUID().toString().replace("-", "");
        command.setTaskId(taskId);
        command.setSubmitTime(new Date());
        command.setStatus("running");

        // 下发命令给Agent
        agentService.sendDiagnoseCommand(command.getAgentId(), command.getCommand());

        // 模拟执行，后面对接真实Agent
        new Thread(() -> {
            try {
                // 模拟执行时间
                Thread.sleep(1000);
                
                // 模拟返回结果
                StringBuilder result = new StringBuilder();
                result.append("=== 命令 [").append(command.getCommand()).append("] 执行结果 ===\n");
                result.append("Agent ID: ").append(command.getAgentId()).append("\n");
                result.append("任务 ID: ").append(taskId).append("\n");
                result.append("执行时间: ").append(new Date()).append("\n\n");
                
                if (command.getCommand().startsWith("thread")) {
                    result.append("线程数: 128\n");
                    result.append("活跃线程: 45\n");
                    result.append("守护线程: 32\n");
                    result.append("峰值线程: 156\n");
                } else if (command.getCommand().startsWith("jvm")) {
                    result.append("堆内存: 4G / 8G\n");
                    result.append("非堆内存: 512M / 1G\n");
                    result.append("GC次数: YGC 1234, FGC 12\n");
                    result.append("GC耗时: YGC 12.5s, FGC 2.3s\n");
                } else if (command.getCommand().startsWith("trace")) {
                    result.append("方法调用链路: \n");
                    result.append("com.example.service.OrderService.createOrder()\n");
                    result.append("  └─ com.example.dao.OrderDao.insert() 耗时 23ms\n");
                    result.append("  └─ com.example.service.UserService.getUserInfo() 耗时 15ms\n");
                    result.append("  └─ com.example.service.PayService.pay() 耗时 128ms\n");
                    result.append("总耗时: 172ms\n");
                } else {
                    result.append("命令执行成功！\n");
                    result.append("返回内容: 模拟执行结果，对接真实Agent后显示实际输出\n");
                }

                String resultStr = result.toString();
                // 推送执行结果给前端
                webSocketService.pushCommandResult(taskId, resultStr);
                
                // AI自动分析结果
                aiDiagnoseService.analyzeResult(command.getCommand(), resultStr, taskId);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        return taskId;
    }

    /**
     * 查询命令执行结果
     */
    @GetMapping("/result/{taskId}")
    public String getCommandResult(@PathVariable String taskId) {
        // 后面实现从存储中查询结果
        return "任务 " + taskId + " 执行完成";
    }
}
