package org.xi.lt.plugin.test;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 插件测试应用启动类
 * @author LT Monitor Dev
 * @date 2026/05/07
 */
@SpringBootApplication(exclude = {
    org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchRestClientAutoConfiguration.class,
    org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration.class,
    org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration.class,
    org.springframework.cloud.gateway.config.GatewayClassPathWarningAutoConfiguration.class
})
public class PluginTestApplication {
    public static void main(String[] args) {
        SpringApplication.run(PluginTestApplication.class, args);
    }
}
