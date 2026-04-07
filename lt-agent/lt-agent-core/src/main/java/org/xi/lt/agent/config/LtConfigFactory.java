package org.xi.lt.agent.config;

import org.xi.lt.agent.log.LogUtil;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 配置工厂
 * 这里的日志打印使用{@link LogUtil}没有使用{@link org.xi.lt.agent.log.LogFactory}因为LogFactory初始化也需要依赖该类加载配置
 * @author yuan
 * @date 2018/9/4
 */
public class LtConfigFactory {
    private static ConcurrentHashMap<String, AbstractLtConfig> configMap = new ConcurrentHashMap<String, AbstractLtConfig>();

    private static LtConfigFactory inst;

    public static LtConfigFactory me() {
        if (inst == null) {
            synchronized (LtConfigFactory.class) {
                if (inst == null) {
                    inst = new LtConfigFactory();
                }
            }
        }
        return inst;
    }

    public void registryConfig(String name, AbstractLtConfig config) {
        //这里日志打印不能使用LogFactory
        LogUtil.log("注册配置:" + name);
        configMap.put(name, config);
    }

    public void refresh() {
        //这里日志打印不能使用LogFactory
        LogUtil.log("刷新配置");
        for (Map.Entry<String, AbstractLtConfig> entry : configMap.entrySet()) {
            LogUtil.log("清除配置:" + entry.getKey());
            entry.getValue().clear();
        }
    }
}
