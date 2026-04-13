package org.xi.lt.server.infrastructure.stream.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"org.xi.lt.server"})
public class LtStreamServerApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(LtStreamServerApplication.class);
        application.addInitializers(new LtStreamServerInitializer());
        application.run(args);
    }
}

