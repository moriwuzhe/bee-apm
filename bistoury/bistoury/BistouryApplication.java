package com.bistoury;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BistouryApplication {
    public static void main(String[] args) {
        SpringApplication.run(BistouryApplication.class, args);
    }
}