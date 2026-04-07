package org.xi.lt.agent.plugin.common;

import org.xi.lt.agent.config.AbstractLtConfig;
import org.xi.lt.agent.config.LtConfigFactory;
import org.xi.lt.agent.config.ConfigUtils;

public class SpringTxConfig extends AbstractLtConfig {
    private static SpringTxConfig config;
    private Boolean enable;
    private long spend;

    public static SpringTxConfig me(){
        if(config == null){
            synchronized (SpringTxConfig.class){
                if(config == null){
                    config = new SpringTxConfig();
                    LtConfigFactory.me().registryConfig("springTx",config);
                }
            }
        }
        return config;
    }

    private SpringTxConfig(){
        initConfig();
    }

    @Override
    public void initConfig() {
        enable = ConfigUtils.me().getBoolean("plugins.springTx.enable",true);
        spend = ConfigUtils.me().getInt("plugins.springTx.spend",-1);
    }

    @Override
    public void clear() {
        config = null;
    }

    public long getSpend() {
        return spend;
    }

    public Boolean isEnable() {
        return enable;
    }
}
