package com.example.testdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Bee-APM 测试应用启动类
 * @author Test
 */
@SpringBootApplication
@RestController
@EnableFeignClients
public class TestDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestDemoApplication.class, args);
        System.out.println("Bee-APM Test Demo started successfully!");
    }

    /**
     * 测试接口：模拟普通HTTP请求
     */
    @GetMapping("/test")
    public String test() {
        return "Hello Bee-APM!";
    }

    /**
     * 测试接口：模拟500ms慢请求
     */
    @GetMapping("/slow-test")
    public String slowTest() throws InterruptedException {
        Thread.sleep(500);
        return "Slow Response";
    }
}
