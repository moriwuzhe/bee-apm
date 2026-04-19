package org.xi.lt.agent.config;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONPath;
import org.xi.lt.agent.common.LtThreadFactory;
import org.xi.lt.agent.common.LtUtils;
import org.xi.lt.agent.common.SysPropKey;
import org.xi.lt.agent.log.LogUtil;
import org.yaml.snakeyaml.Yaml;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * 配置文件读取
 *
 * @author yuan
 */
public class ConfigUtils {
    private long configLastTime = 0;
    private String configPath;
    private JSONObject config;
    private static ConfigUtils instance;
    private static final String THREAD_NAME = "config-listener";
    private ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
    private static ScheduledExecutorService service = new ScheduledThreadPoolExecutor(1, new LtThreadFactory(THREAD_NAME));

    public static ConfigUtils me() {
        if (instance == null) {
            synchronized (ConfigUtils.class) {
                if (instance == null) {
                    instance = new ConfigUtils();
                }
            }
        }
        return instance;
    }

    private void configFileModifyListener() {
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                if (doLoadConfig()) {
                    LtConfigFactory.me().refresh();
                }
            }
        }, 0, 10, TimeUnit.SECONDS);
    }


    public ConfigUtils() {
        initConfigPath();
        doLoadConfig();
        configFileModifyListener();
    }

    private void initConfigPath() {
        configPath = System.getProperty(SysPropKey.LT_CONFIG);
        if (LtUtils.isBlank(configPath)) {
            configPath = LtUtils.getJarDirPath() + "/config.yml";
        }
    }

    private boolean doLoadConfig() {
        FileInputStream fis = null;
        boolean isReload = false;
        try {
            Yaml yaml = new Yaml();
            File configFile = new File(configPath);
            long lastTime = configFile.lastModified();
            if (lastTime > configLastTime) {
                configLastTime = configFile.lastModified();
                fis = new FileInputStream(configFile);
                Map map = yaml.load(fis);
                try {
                    readWriteLock.writeLock().lock();
                    config = JSON.parseObject(JSON.toJSONString(map));
                    isReload = true;
                } finally {
                    readWriteLock.writeLock().unlock();
                }
            }
        } catch (Exception e) {
            LogUtil.log("配置文件加载失败" + configPath, e);
        } finally {
            LtUtils.close(fis);
        }
        return isReload;
    }
    
    /**
     * 公开方法：强制重新加载配置（用于配置热更新）
     */
    public void loadConfig() {
        // 重置时间戳，强制重新加载
        configLastTime = 0;
        doLoadConfig();
    }
    
    /**
     * 设置配置值（用于动态配置）
     */
    public void setStr(String key, String value) {
        try {
            readWriteLock.writeLock().lock();
            if (config == null) {
                config = new JSONObject();
            }
            // 支持嵌套key，如 "config.version"
            String[] keys = key.split("\\.");
            JSONObject current = config;
            for (int i = 0; i < keys.length - 1; i++) {
                if (!current.containsKey(keys[i])) {
                    current.put(keys[i], new JSONObject());
                }
                current = current.getJSONObject(keys[i]);
            }
            current.put(keys[keys.length - 1], value);
        } finally {
            readWriteLock.writeLock().unlock();
        }
    }

    private Object parseValue(String key) {
        try {
            readWriteLock.readLock().lock();
            Object value = System.getProperty("lt." + key);
            if (value != null) {
                return value;
            }
            if (config != null) {
                return JSONPath.eval(config, "$." + key);
            }
            return null;
        } finally {
            readWriteLock.readLock().unlock();
        }
    }

    public Object getVal(String key) {
        return parseValue(key);
    }

    public String getStr(String key) {
        Object obj = parseValue(key);
        if (obj != null) {
            return obj.toString();
        }
        return null;
    }

    public Integer getInt(String key) {
        Object val = parseValue(key);
        if (val == null) {
            return null;
        }
        if (val instanceof Integer) {
            return (Integer) val;
        }
        return Integer.parseInt(val.toString());
    }

    public Long getLong(String key) {
        Object val = parseValue(key);
        if (val != null) {
            return Long.parseLong(val.toString());
        }
        return null;
    }

    public String getStr(String key, String def) {
        String val = getStr(key);
        if (val == null) {
            return def;
        }
        return val;
    }

    public Integer getInt(String key, Integer def) {
        Integer val = getInt(key);
        if (val == null) {
            return def;
        }
        return val;
    }

    public Long getLong(String key, Long def) {
        Long val = getLong(key);
        if (val == null) {
            return def;
        }
        return val;
    }

    public Boolean getBoolean(String key) {
        Object val = parseValue(key);
        if (val == null) {
            return null;
        }
        if (val instanceof Boolean) {
            return (Boolean) val;
        }
        return Boolean.parseBoolean(val.toString());
    }

    public Boolean getBoolean(String key, Boolean def) {
        Boolean b = getBoolean(key);
        if (b == null) {
            return def;
        }
        return b;
    }

    public List<String> getList(String key) {
        return (List<String>) parseValue(key);
    }


}
