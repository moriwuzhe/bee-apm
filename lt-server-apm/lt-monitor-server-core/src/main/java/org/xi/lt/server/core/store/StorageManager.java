package org.xi.lt.server.core.store;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xi.lt.server.core.common.ConfigHolder;
import org.xi.lt.server.core.common.ServiceProviderLoader;
import org.xi.lt.server.domain.repository.UnifiedDataStore;

/**
 * 存储管理器
 * 统一管理所有数据存储适配器，提供统一的读写接口
 * 
 * @author system
 * @date 2026/04/15
 */
public class StorageManager {
    private static final Logger logger = LoggerFactory.getLogger(StorageManager.class);
    
    private static volatile StorageManager instance;
    private static UnifiedDataStore unifiedStore;
    
    private StorageManager() {
        init();
    }
    
    /**
     * 获取单例实例
     * @return StorageManager 实例
     */
    public static StorageManager getInstance() {
        if (instance == null) {
            synchronized (StorageManager.class) {
                if (instance == null) {
                    instance = new StorageManager();
                }
            }
        }
        return instance;
    }
    
    /**
     * 初始化存储管理器
     */
    public void init() {
        try {
            // 从配置中读取存储类型，默认使用Spring Data架构适配器
            String storeName = ConfigHolder.getProperty("lt.store.name", "spring-data-adapter");
            
            logger.info("Initializing storage manager with store type: {}", storeName);
            
            // 加载统一数据存储适配器
            ServiceProviderLoader loader = new ServiceProviderLoader("lt-store.def");
            unifiedStore = loader.load(storeName);
            
            if (unifiedStore != null) {
                unifiedStore.init();
                logger.info("Storage manager initialized successfully with: {}", storeName);
            } else {
                logger.error("Failed to load store: {}", storeName);
            }
        } catch (Exception e) {
            logger.error("Failed to initialize storage manager", e);
        }
    }
    
    /**
     * 获取统一数据存储
     * @return UnifiedDataStore 实例
     */
    public UnifiedDataStore getUnifiedStore() {
        if (unifiedStore == null) {
            throw new IllegalStateException("StorageManager not initialized");
        }
        return unifiedStore;
    }
    
    /**
     * 重置存储（用于测试或动态切换）
     */
    public synchronized void reset() {
        unifiedStore = null;
        instance = null;
        logger.info("StorageManager reset");
    }
}
