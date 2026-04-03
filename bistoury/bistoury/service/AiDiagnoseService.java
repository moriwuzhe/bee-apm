package com.bistoury.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import javax.annotation.Resource;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * AI诊断服务：自动分析诊断结果，给出根因和修复方案
 */
@Slf4j
@Service
public class AiDiagnoseService {

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:https://ark.cn-beijing.volces.com.com/api/v3/chat/completions}")
    private String apiUrl;

    @Value("${ai.model:doubao-seed-2.0-pro}")
    private String model;

    @Resource
    private WebSocketService webSocketService;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 自动分析诊断命令结果
     * @param command 执行的命令
     * @param result 命令执行结果
     * @param taskId 任务ID，用于推送分析结果
     */
    public void analyzeResult(String command, String result, String taskId) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            // 没有配置API Key，返回模拟分析结果
            String mockAnalysis = generateMockAnalysis(command, result);
            pushAnalysisResult(taskId, mockAnalysis);
            return;
        }

        // 异步调用AI分析
        new Thread(() -> {
            try {
                String analysis = callAiApi(command, result);
                pushAnalysisResult(taskId, analysis);
            } catch (Exception e) {
                log.error("AI分析失败：{}", e.getMessage(), e);
                pushAnalysisResult(taskId, "⚠️ AI分析失败，请稍后重试：" + e.getMessage());
            }
        }).start();
    }

    /**
     * 调用大模型API进行分析
     */
    private String callAiApi(String command, String result) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> request = new HashMap<>();
        request.put("model", model);
        request.put("temperature", 0.1);
        request.put("max_tokens", 2000);

        String prompt = buildPrompt(command, result);
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", "你是专业的Java性能诊断专家，根据Arthas命令的执行结果，分析问题根因并给出具体的修复方案。回答要简洁专业，重点突出，用中文回答。");
        
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        
        request.put("messages", Arrays.asList(systemMessage, userMessage));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JSONObject json = JSON.parseObject(response.getBody());
            return json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");
        } else {
            throw new Exception("API调用失败，状态码：" + response.getStatusCode());
        }
    }

    /**
     * 构建提示词
     */
    private String buildPrompt(String command, String result) {
        return "我执行了Arthas命令：" + command + "\n" +
                "命令执行结果如下：\n" + result + "\n\n" +
                "请你：\n" +
                "1. 首先分析这个结果是否正常，有没有问题\n" +
                "2. 如果有问题，说明根因是什么\n" +
                "3. 给出具体的修复方案和优化建议\n" +
                "4. 分点说明，简洁专业，不要冗余内容";
    }

    /**
     * 生成模拟分析结果（没配置API Key时使用）
     */
    private String generateMockAnalysis(String command, String result) {
        StringBuilder analysis = new StringBuilder();
        analysis.append("\n\n🤖 === AI自动分析结果 ===\n");

        if (command.startsWith("thread")) {
            analysis.append("✅ 线程状态分析：\n");
            analysis.append("1. 线程总数128处于合理范围，活跃线程45占比35%，无线程阻塞问题\n");
            analysis.append("2. 未发现死锁、线程泄漏等异常情况\n");
            analysis.append("3. 建议：保持当前线程池配置，监控峰值流量时的线程增长情况\n");
        } else if (command.startsWith("jvm")) {
            analysis.append("⚠️ JVM内存分析：\n");
            analysis.append("1. 堆内存使用4G/8G，使用率50%，处于健康水平\n");
            analysis.append("2. Full GC 12次，总耗时2.3s，平均每次191ms，略高于警戒值100ms\n");
            analysis.append("3. 根因：老年代内存占用较高，对象晋升效率低\n");
            analysis.append("4. 修复建议：\n");
            analysis.append("   - 调整老年代大小为6G，减少Full GC频率\n");
            analysis.append("   - 开启-XX:+UseCMSInitiatingOccupancyOnly，设置触发阈值为70%\n");
            analysis.append("   - 检查大对象创建逻辑，避免短期大对象直接进入老年代\n");
        } else if (command.startsWith("trace")) {
            analysis.append("⚠️ 方法调用链路分析：\n");
            analysis.append("1. 支付方法pay()耗时128ms，占总耗时74%，是性能瓶颈\n");
            analysis.append("2. 根因：支付接口调用第三方支付网关超时，同步等待时间过长\n");
            analysis.append("3. 修复建议：\n");
            analysis.append("   - 支付接口添加异步化改造，同步返回结果后后台异步处理\n");
            analysis.append("   - 配置支付接口超时时间为30ms，失败自动重试2次\n");
            analysis.append("   - 添加支付接口熔断降级机制，异常时快速返回友好提示\n");
            analysis.append("   - 监控支付接口成功率和耗时，异常及时告警\n");
        } else {
            analysis.append("✅ 命令执行结果分析：\n");
            analysis.append("1. 执行结果正常，未发现明显异常\n");
            analysis.append("2. 建议：结合监控数据进一步分析业务指标是否符合预期\n");
        }

        analysis.append("\n💡 以上为AI模拟分析结果，配置API Key后启用真实大模型分析。");
        return analysis.toString();
    }

    /**
     * 推送分析结果到前端
     */
    private void pushAnalysisResult(String taskId, String analysis) {
        webSocketService.pushCommandResult(taskId, analysis);
    }
}
