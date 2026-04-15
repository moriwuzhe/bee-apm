package org.xi.lt.server.infrastructure.store.elasticsearch.config;

import io.searchbox.client.JestClient;
import io.searchbox.client.JestClientFactory;
import io.searchbox.client.config.HttpClientConfig;
import org.apache.http.HttpHost;
import org.apache.commons.lang3.StringUtils;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Elasticsearch Jest 客户端配置
 * 
 * @author system
 * @date 2026/04/15
 */
@Configuration
@ConditionalOnProperty(name = "lt.store.name", havingValue = "elasticsearch", matchIfMissing = false)
public class ElasticsearchJestConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(ElasticsearchJestConfig.class);
    
    @Value("${lt.store.elasticsearch.urls:http://localhost:9200}")
    private String urls;
    
    @Value("${lt.store.elasticsearch.username:}")
    private String username;
    
    @Value("${lt.store.elasticsearch.password:}")
    private String password;
    
    @Value("${lt.store.elasticsearch.http.max-total-connection:100}")
    private int maxTotalConnection;
    
    @Value("${lt.store.elasticsearch.http.default-max-per-route:20}")
    private int defaultMaxPerRoute;
    
    @Value("${lt.store.elasticsearch.http.conn-timeout:5000}")
    private int connTimeout;
    
    @Value("${lt.store.elasticsearch.http.read-timeout:30000}")
    private int readTimeout;
    
    @Value("${lt.store.elasticsearch.http.max-connection-idle-time:60}")
    private int maxConnectionIdleTime;
    
    @Value("${lt.store.elasticsearch.discovery.enabled:false}")
    private boolean discoveryEnabled;
    
    @Value("${lt.store.elasticsearch.discovery.frequency:30000}")
    private long discoveryFrequency;
    
    @Value("${elasticsearch.host:127.0.0.1}")
    private String esHost;
    
    @Value("${elasticsearch.port:9200}")
    private int esPort;
    
    @Value("${elasticsearch.scheme:http}")
    private String esScheme;

    /**
     * 创建 JestClient Bean
     */
    @Bean(destroyMethod = "shutdownClient")
    public JestClient jestClient() {
        logger.info("Initializing JestClient with URLs: {}", urls);
        
        String[] urlArray = urls.split(",");
        HttpClientConfig.Builder builder = new HttpClientConfig.Builder(Arrays.asList(urlArray));
        
        // 认证配置
        if (StringUtils.isNotBlank(username)) {
            builder = builder.defaultCredentials(username, password);
            logger.debug("Using authentication for user: {}", username);
        }
        
        // 连接池配置
        builder = builder
            .maxTotalConnection(maxTotalConnection)
            .defaultMaxTotalConnectionPerRoute(defaultMaxPerRoute)
            .connTimeout(connTimeout)
            .readTimeout(readTimeout)
            .maxConnectionIdleTime(maxConnectionIdleTime, TimeUnit.SECONDS);
        
        // 服务发现配置
        if (discoveryEnabled) {
            builder = builder
                .discoveryEnabled(true)
                .discoveryFrequency(discoveryFrequency, TimeUnit.MILLISECONDS);
            logger.info("Service discovery enabled with frequency: {}ms", discoveryFrequency);
        }
        
        JestClientFactory factory = new JestClientFactory();
        factory.setHttpClientConfig(builder.build());
        
        JestClient client = factory.getObject();
        logger.info("JestClient initialized successfully");
        
        return client;
    }
    
    /**
     * 创建 RestHighLevelClient Bean
     */
    @Bean(destroyMethod = "close")
    public RestHighLevelClient restHighLevelClient() {
        logger.info("Initializing RestHighLevelClient with {}: {}:{}", esScheme, esHost, esPort);
        RestClient restClient = RestClient.builder(new HttpHost(esHost, esPort, esScheme)).build();
        RestHighLevelClient client = new RestHighLevelClient(restClient);
        logger.info("RestHighLevelClient initialized successfully");
        return client;
    }
}
