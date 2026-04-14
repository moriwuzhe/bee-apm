package org.xi.lt.server.infrastructure;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.xi.lt.server.core.common.ConfigHolder;

public class LtStreamServerInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigHolder.buildConfig(applicationContext.getEnvironment());
    }
}

