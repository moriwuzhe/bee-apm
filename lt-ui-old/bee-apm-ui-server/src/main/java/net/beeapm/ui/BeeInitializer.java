package org.xi.lt.ui;


import org.xi.lt.ui.common.ConfigHolder;
import org.xi.lt.ui.es.EsQueryStringMap;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class BeeInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext configurableApplicationContext) {
        ConfigHolder.buildConfig(configurableApplicationContext.getEnvironment());
        EsQueryStringMap.me();
    }

}
