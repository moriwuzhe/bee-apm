package org.xi.lt.server.infrastructure.store.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * 存储服务自动配置
 * DDD架构 - 配置层
 * 
 * @author system
 * @date 2026/04/15
 */
@Configuration
@ComponentScan(basePackages = "org.xi.lt.server.infrastructure.store")
@ConditionalOnProperty(name = "lt.store.enabled", havingValue = "true", matchIfMissing = true)
public class StoreAutoConfiguration {
    // Spring会自动扫描并注册所有@Component和@Repository
}
