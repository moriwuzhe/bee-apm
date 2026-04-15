package org.xi.lt.server.core.handler;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.core.common.Stream;
import org.xi.lt.server.domain.repository.UnifiedDataStore;
import org.xi.lt.server.core.store.StorageManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * @author yuan
 * @date 2018/08/27
 */
@LtPlugin(type = "HANDLER", name = "store")
public class StoreStreamHandler extends AbstractStreamHandler {
    private static final Logger logger = LoggerFactory.getLogger(StoreStreamHandler.class);
    UnifiedDataStore store;
    
    @Override
    public void doInit() throws Exception {
        // 使用新的 StorageManager 获取统一数据存储
        store = StorageManager.getInstance().getUnifiedStore();
        logger.info("StoreStreamHandler initialized with UnifiedDataStore");
    }

    @Override
    public void handle(Stream stream) throws Exception {
        Object obj = stream.getSource();
        logger.debug("StoreStreamHandler received: {}", obj);
        if(obj.getClass().isArray()){
            logger.debug("StoreStreamHandler saving array");
            store.save((Object[])obj);
        }else {
            logger.debug("StoreStreamHandler saving single");
            store.save(obj);
        }
    }
}
