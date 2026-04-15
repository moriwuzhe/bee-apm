package org.xi.lt.server.infrastructure.ingestion.cleanup;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// import org.springframework.scheduling.annotation.EnableScheduling;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Component;
// import org.xi.lt.server.core.common.ConfigHolder;
// import org.xi.lt.server.core.store.StorageManager;
// import org.xi.lt.server.domain.repository.UnifiedDataStore;

/**
 * 索引/数据清理定时任务
 * 每天凌晨3点执行，清理过期数据
 * 
 * @author system
 * @date 2026/04/15
 */
// TODO: 等待 StorageManager 实现后启用
// @Component
// @EnableScheduling
public class IndexCleanupTask {
    private static final Logger logger = LoggerFactory.getLogger(IndexCleanupTask.class);

    /**
     * 每天凌晨3点执行清理任务
     */
    // @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldData() {
        // TODO: 等待 StorageManager 实现后启用
        logger.info("IndexCleanupTask disabled - waiting for StorageManager implementation");
        /*
        try {
            // 从配置中读取保留天数，默认7天
            int retentionDays = ConfigHolder.getPropInt("lt.store.retention.days", 7);
            logger.info("Starting scheduled cleanup of data older than {} days", retentionDays);
            
            // 使用新的 StorageManager 获取统一数据存储
            UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
            if (store != null) {
                store.clean(retentionDays);
                logger.info("Scheduled cleanup completed successfully");
            } else {
                logger.warn("UnifiedDataStore not initialized, skipping cleanup");
            }
        } catch (Exception e) {
            logger.error("Error during scheduled data cleanup", e);
        }
        */
    }
}
