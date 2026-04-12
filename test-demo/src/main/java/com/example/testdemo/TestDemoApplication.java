package com.example.testdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Lt-APM 测试应用启动类
 * @author Test
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
@RestController
@EnableFeignClients
public class TestDemoApplication {

    private static final Logger log = LoggerFactory.getLogger(TestDemoApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(TestDemoApplication.class, args);
        System.out.println("Lt-APM Test Demo started successfully!");
    }

    /**
     * 测试接口：模拟普通HTTP请求
     */
    @GetMapping("/test")
    public String test() {
        log.info("Processing /test request. This log should automatically include the TraceId.");
        return "Hello Lt-APM!";
    }

    @GetMapping("/error")
    public String error() {
        log.error("Processing /error request.");
        throw new RuntimeException("Simulated error for Alert Engine!");
    }

    @GetMapping("/slow")
    public String slow() throws InterruptedException {
        log.info("Processing /slow request.");
        Thread.sleep(1500); // 1.5s to trigger latency alert
        return "Slow response";
    }

    /**
     * 测试接口：模拟500ms慢请求
     */
    @GetMapping("/slow-test")
    public String slowTest() throws InterruptedException {
        Thread.sleep(500);
        return "Slow Response";
    }

    /**
     * 测试接口：模拟JDK HttpURLConnection请求
     */
    @GetMapping("/jdk-http")
    public String jdkHttp() {
        StringBuilder result = new StringBuilder();
        try {
            URL url = new URL("http://127.0.0.1:8082/test");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String line;
            while ((line = rd.readLine()) != null) {
                result.append(line);
            }
            rd.close();
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
        return "JDK HTTP Result: " + result.toString();
    }
}
