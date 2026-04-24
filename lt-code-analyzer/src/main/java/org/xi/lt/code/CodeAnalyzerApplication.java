package org.xi.lt.code;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 代码分析器应用入口
 */
@SpringBootApplication
public class CodeAnalyzerApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(CodeAnalyzerApplication.class, args);
        System.out.println("========================================");
        System.out.println("  代码分析器启动成功！");
        System.out.println("  访问地址: http://localhost:8083/");
        System.out.println("========================================");
    }
}
