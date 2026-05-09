package org.xi.lt.plugin.test.controller;

import org.springframework.web.bind.annotation.*;
import org.xi.lt.plugin.test.service.PluginTestService;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * 插件测试控制器
 * @author LT Monitor Dev
 * @date 2026/05/07
 */
@RestController
@RequestMapping("/api/plugin-test")
public class PluginTestController {

    @Resource
    private PluginTestService pluginTestService;

    /**
     * 测试所有插件
     */
    @PostMapping("/test-all")
    public Map<String, Object> testAllPlugins() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testAllPlugins();
            result.put("success", true);
            result.put("message", "所有插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "测试失败: " + e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    /**
     * 测试JDBC插件
     */
    @PostMapping("/test-jdbc")
    public Map<String, Object> testJdbc() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testJdbcPlugin();
            result.put("success", true);
            result.put("message", "JDBC插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "JDBC测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试Redis插件
     */
    @PostMapping("/test-redis")
    public Map<String, Object> testRedis() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testRedisPlugin();
            result.put("success", true);
            result.put("message", "Redis插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Redis测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试HTTP客户端插件
     */
    @PostMapping("/test-http")
    public Map<String, Object> testHttp() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testHttpClientPlugins();
            result.put("success", true);
            result.put("message", "HTTP客户端插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "HTTP测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试消息队列插件
     */
    @PostMapping("/test-mq")
    public Map<String, Object> testMQ() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testMQPlugins();
            result.put("success", true);
            result.put("message", "消息队列插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "MQ测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试Logger插件
     */
    @PostMapping("/test-logger")
    public Map<String, Object> testLogger() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testLoggerPlugin();
            result.put("success", true);
            result.put("message", "Logger插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Logger测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试MongoDB插件
     */
    @PostMapping("/test-mongodb")
    public Map<String, Object> testMongoDB() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testMongoDBPlugin();
            result.put("success", true);
            result.put("message", "MongoDB插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "MongoDB测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试Elasticsearch插件
     */
    @PostMapping("/test-es")
    public Map<String, Object> testElasticsearch() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testElasticsearchPlugin();
            result.put("success", true);
            result.put("message", "Elasticsearch插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Elasticsearch测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试Dubbo插件
     */
    @PostMapping("/test-dubbo")
    public Map<String, Object> testDubbo() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testDubboPlugin();
            result.put("success", true);
            result.put("message", "Dubbo插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Dubbo测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试Feign插件
     */
    @PostMapping("/test-feign")
    public Map<String, Object> testFeign() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testFeignPlugin();
            result.put("success", true);
            result.put("message", "Feign插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Feign测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试配置中心插件
     */
    @PostMapping("/test-config")
    public Map<String, Object> testConfigCenter() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testConfigCenterPlugins();
            result.put("success", true);
            result.put("message", "配置中心插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "配置中心测试失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 测试熔断限流插件
     */
    @PostMapping("/test-resilience")
    public Map<String, Object> testResilience() {
        Map<String, Object> result = new HashMap<>();
        try {
            pluginTestService.testResiliencePlugins();
            result.put("success", true);
            result.put("message", "熔断限流插件测试完成");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "熔断限流测试失败: " + e.getMessage());
        }
        return result;
    }
}
