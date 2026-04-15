package org.xi.lt.server.infrastructure.store.mysql;

import com.alibaba.druid.pool.DruidDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * MySQL 数据源配置
 * 使用 Druid 连接池，通过 Spring 管理生命周期
 * 
 * @author system
 * @date 2026/04/15
 */
@Configuration
@ConditionalOnProperty(name = "lt.store.name", havingValue = "mysql", matchIfMissing = false)
public class MysqlDataSourceConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(MysqlDataSourceConfig.class);

    @Value("${lt.store.mysql.url:}")
    private String url;
    
    @Value("${lt.store.mysql.username:root}")
    private String username;
    
    @Value("${lt.store.mysql.password:}")
    private String password;
    
    @Value("${lt.store.mysql.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;
    
    @Value("${lt.store.mysql.pool.initial-size:5}")
    private int initialSize;
    
    @Value("${lt.store.mysql.pool.min-idle:5}")
    private int minIdle;
    
    @Value("${lt.store.mysql.pool.max-active:20}")
    private int maxActive;
    
    @Value("${lt.store.mysql.pool.max-wait:60000}")
    private long maxWait;
    
    @Value("${lt.store.mysql.pool.time-between-eviction-runs-millis:60000}")
    private long timeBetweenEvictionRunsMillis;
    
    @Value("${lt.store.mysql.pool.min-evictable-idle-time-millis:300000}")
    private long minEvictableIdleTimeMillis;
    
    @Value("${lt.store.mysql.pool.validation-query:SELECT 1}")
    private String validationQuery;
    
    @Value("${lt.store.mysql.pool.test-while-idle:true}")
    private boolean testWhileIdle;
    
    @Value("${lt.store.mysql.pool.test-on-borrow:false}")
    private boolean testOnBorrow;
    
    @Value("${lt.store.mysql.pool.test-on-return:false}")
    private boolean testOnReturn;

    /**
     * 创建 Druid DataSource Bean
     */
    @Bean(destroyMethod = "close")
    public DataSource mysqlDataSource() {
        logger.info("Initializing MySQL Druid DataSource with URL: {}", url);
        
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        
        // 连接池配置
        dataSource.setInitialSize(initialSize);
        dataSource.setMinIdle(minIdle);
        dataSource.setMaxActive(maxActive);
        dataSource.setMaxWait(maxWait);
        
        // 连接检测配置
        dataSource.setTimeBetweenEvictionRunsMillis(timeBetweenEvictionRunsMillis);
        dataSource.setMinEvictableIdleTimeMillis(minEvictableIdleTimeMillis);
        dataSource.setValidationQuery(validationQuery);
        dataSource.setTestWhileIdle(testWhileIdle);
        dataSource.setTestOnBorrow(testOnBorrow);
        dataSource.setTestOnReturn(testOnReturn);
        
        try {
            dataSource.init();
            logger.info("MySQL Druid DataSource initialized successfully");
        } catch (SQLException e) {
            logger.error("Failed to initialize MySQL Druid DataSource", e);
            throw new RuntimeException("Failed to initialize MySQL DataSource", e);
        }
        
        return dataSource;
    }
}
