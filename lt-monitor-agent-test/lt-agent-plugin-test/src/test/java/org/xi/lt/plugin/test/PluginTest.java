package org.xi.lt.plugin.test;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.xi.lt.plugin.test.service.PluginTestService;

import javax.annotation.Resource;

/**
 * 插件测试单元测试
 * @author LT Monitor Dev
 * @date 2026/05/07
 */
@RunWith(SpringRunner.class)
@SpringBootTest
public class PluginTest {

    @Resource
    private PluginTestService pluginTestService;

    /**
     * 测试JDBC插件
     */
    @Test
    public void testJdbcPlugin() {
        System.out.println("========== 开始测试JDBC插件 ==========");
        pluginTestService.testJdbcPlugin();
        System.out.println("========== JDBC插件测试完成 ==========");
    }

    /**
     * 测试Logger插件
     */
    @Test
    public void testLoggerPlugin() {
        System.out.println("========== 开始测试Logger插件 ==========");
        pluginTestService.testLoggerPlugin();
        System.out.println("========== Logger插件测试完成 ==========");
    }

    /**
     * 测试HTTP客户端插件
     */
    @Test
    public void testHttpClientPlugins() {
        System.out.println("========== 开始测试HTTP客户端插件 ==========");
        pluginTestService.testHttpClientPlugins();
        System.out.println("========== HTTP客户端插件测试完成 ==========");
    }

    /**
     * 测试线程插件
     */
    @Test
    public void testThreadPlugin() {
        System.out.println("========== 开始测试线程插件 ==========");
        pluginTestService.testThreadPlugin();
        System.out.println("========== 线程插件测试完成 ==========");
    }

    /**
     * 测试Process插件
     */
    @Test
    public void testProcessPlugin() {
        System.out.println("========== 开始测试Process插件 ==========");
        pluginTestService.testProcessPlugin();
        System.out.println("========== Process插件测试完成 ==========");
    }

    /**
     * 测试所有基础插件(不需要外部依赖)
     */
    @Test
    public void testAllBasicPlugins() {
        System.out.println("========== 开始测试所有基础插件 ==========");
        
        // 测试不需要外部依赖的插件
        pluginTestService.testJdbcPlugin();
        pluginTestService.testLoggerPlugin();
        pluginTestService.testHttpClientPlugins();
        pluginTestService.testThreadPlugin();
        pluginTestService.testProcessPlugin();
        
        System.out.println("========== 所有基础插件测试完成 ==========");
    }

    /**
     * 测试MongoDB插件
     */
    @Test
    public void testMongoDBPlugin() {
        System.out.println("========== 开始测试MongoDB插件 ==========");
        pluginTestService.testMongoDBPlugin();
        System.out.println("========== MongoDB插件测试完成 ==========");
    }

    /**
     * 测试Elasticsearch插件
     */
    @Test
    public void testElasticsearchPlugin() {
        System.out.println("========== 开始测试Elasticsearch插件 ==========");
        pluginTestService.testElasticsearchPlugin();
        System.out.println("========== Elasticsearch插件测试完成 ==========");
    }

    /**
     * 测试Dubbo插件
     */
    @Test
    public void testDubboPlugin() {
        System.out.println("========== 开始测试Dubbo插件 ==========");
        pluginTestService.testDubboPlugin();
        System.out.println("========== Dubbo插件测试完成 ==========");
    }

    /**
     * 测试Feign插件
     */
    @Test
    public void testFeignPlugin() {
        System.out.println("========== 开始测试Feign插件 ==========");
        pluginTestService.testFeignPlugin();
        System.out.println("========== Feign插件测试完成 ==========");
    }

    /**
     * 测试配置中心插件
     */
    @Test
    public void testConfigCenterPlugins() {
        System.out.println("========== 开始测试配置中心插件 ==========");
        pluginTestService.testConfigCenterPlugins();
        System.out.println("========== 配置中心插件测试完成 ==========");
    }

    /**
     * 测试熔断限流插件
     */
    @Test
    public void testResiliencePlugins() {
        System.out.println("========== 开始测试熔断限流插件 ==========");
        pluginTestService.testResiliencePlugins();
        System.out.println("========== 熔断限流插件测试完成 ==========");
    }
}
