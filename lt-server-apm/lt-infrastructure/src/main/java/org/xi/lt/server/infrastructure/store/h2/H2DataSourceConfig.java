package org.xi.lt.server.infrastructure.store.h2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

import javax.sql.DataSource;

/**
 * H2 数据源配置
 * 使用 Spring Embedded Database，适用于开发和测试环境
 * 
 * @author system
 * @date 2026/04/15
 */
@Configuration
@ConditionalOnProperty(name = "lt.store.name", havingValue = "h2", matchIfMissing = true)
public class H2DataSourceConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(H2DataSourceConfig.class);

    /**
     * 创建 H2 嵌入式数据库 Bean
     */
    @Bean(destroyMethod = "shutdown")
    public DataSource h2DataSource() {
        logger.info("Initializing H2 embedded DataSource");
        
        return new EmbeddedDatabaseBuilder()
            .generateUniqueName(true)
            .setType(EmbeddedDatabaseType.H2)
            .addScript("classpath:schema-h2.sql")  // 可选：初始化脚本
            .build();
    }
}
