package com.bistoury.config;

import com.bistoury.netty.AgentMessageDecoder;
import com.bistoury.netty.AgentMessageEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Netty配置类
 */
@Configuration
public class NettyConfig {

    @Bean
    public AgentMessageDecoder agentMessageDecoder() {
        return new AgentMessageDecoder();
    }

    @Bean
    public AgentMessageEncoder agentMessageEncoder() {
        return new AgentMessageEncoder();
    }
}
