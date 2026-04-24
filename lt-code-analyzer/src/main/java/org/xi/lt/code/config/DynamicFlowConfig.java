package org.xi.lt.code.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.xi.lt.code.dynamic.DemoSpanGenerator;
import org.xi.lt.code.dynamic.InMemorySpanStore;
import org.xi.lt.code.dynamic.SpanToFlowGraphConverter;
import org.xi.lt.server.domain.model.span.SpanView;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.UUID;

/**
 * 动态流程图配置
 * 初始化动态 APM 相关组件
 */
@Slf4j
@Configuration
public class DynamicFlowConfig {

    @Bean
    public InMemorySpanStore inMemorySpanStore() {
        return new InMemorySpanStore();
    }

    @Bean
    public SpanToFlowGraphConverter spanToFlowGraphConverter() {
        return new SpanToFlowGraphConverter();
    }

    /**
     * 演示数据初始化器
     */
    @Configuration
    public static class DemoDataInitializer {

        @Autowired
        private InMemorySpanStore spanStore;

        /**
         * 初始化演示数据
         */
        @PostConstruct
        public void initDemoData() {
            // 生成几个演示 Trace
            for (int i = 0; i < 3; i++) {
                String traceId = UUID.randomUUID().toString().replace("-", "");
                List<SpanView> spans = DemoSpanGenerator.generateDemoTrace(traceId);
                spanStore.saveSpans(spans);
            }

            log.info("初始化演示数据完成，Trace 数量: {}, Span 数量: {}",
                    spanStore.getTraceCount(), spanStore.getSpanCount());
        }
    }
}
