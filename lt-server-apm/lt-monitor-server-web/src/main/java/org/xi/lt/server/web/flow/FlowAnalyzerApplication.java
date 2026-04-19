package org.xi.lt.server.web.flow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 流程图分析器应用入口
 */
@SpringBootApplication
public class FlowAnalyzerApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(FlowAnalyzerApplication.class, args);
        System.out.println("========================================");
        System.out.println("  流程图分析器启动成功！");
        System.out.println("  访问地址: http://localhost:8082/");
        System.out.println("========================================");
    }
}
