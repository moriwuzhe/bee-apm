package org.xi.lt.demo;


import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;

public class DemoInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    ExecutorService executor;
    ExecutorService executor2;
    ExecutorService executor3;
    @Override
    public void initialize(ConfigurableApplicationContext configurableApplicationContext) {
        executor = Executors.newFixedThreadPool(10);
        executor2 = Executors.newSingleThreadScheduledExecutor();
        executor3 = Executors.newCachedThreadPool();
    }

}
