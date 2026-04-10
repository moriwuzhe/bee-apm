package org.xi.lt.server.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchRestClientAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * LT-Monitor 服务端启动类
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
@SpringBootApplication(exclude = {ElasticsearchRestClientAutoConfiguration.class})
@ComponentScan(basePackages = {"org.xi.lt.server"})
public class LtMonitorServerApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(LtMonitorServerApplication.class);
        application.addInitializers(new LtMonitorServerInitializer());
        application.run(args);
    }
}
