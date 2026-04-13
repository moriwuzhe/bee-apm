package org.xi.lt.server.infrastructure.stream.server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.xi.lt.server.core.common.ConfigHolder;
import org.xi.lt.server.core.store.StoreFactory;

@Component
@EnableScheduling
public class IndexCleanupTask {
    private static final Logger logger = LoggerFactory.getLogger(IndexCleanupTask.class);

    // Run every day at 3 AM
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldIndices() {
        try {
            int retentionDays = ConfigHolder.getPropInt("lt.store.elasticsearch.retention.days", 7);
            logger.info("Starting scheduled cleanup of Elasticsearch indices older than {} days", retentionDays);
            
            if (StoreFactory.getInstance().getStore() != null) {
                StoreFactory.getInstance().getStore().clean(retentionDays);
            }
        } catch (Exception e) {
            logger.error("Error during scheduled index cleanup", e);
        }
    }
}
