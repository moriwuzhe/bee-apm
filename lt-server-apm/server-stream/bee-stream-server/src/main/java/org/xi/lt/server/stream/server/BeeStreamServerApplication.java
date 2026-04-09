package org.xi.lt.server.stream.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"org.xi.lt.server"})
public class BeeStreamServerApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(BeeStreamServerApplication.class);
        application.addInitializers(new BeeStreamServerInitializer());
        application.run(args);
    }
}

