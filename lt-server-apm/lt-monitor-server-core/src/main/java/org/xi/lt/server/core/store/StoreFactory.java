package org.xi.lt.server.core.store;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xi.lt.server.core.common.ConfigHolder;
import org.xi.lt.server.core.common.ServiceProviderLoader;
import org.xi.lt.server.domain.repository.IStore;

/**
 * @author yuan
 * @date 2018/08/27
 */
public class StoreFactory {
    private static Logger logger = LoggerFactory.getLogger(StoreFactory.class);
    static volatile StoreFactory instance;
    static IStore store;

    public StoreFactory() {
        init();
    }

    public static StoreFactory getInstance() {
        if (instance == null) {
            synchronized (StoreFactory.class) {
                if (instance == null) {
                    instance = new StoreFactory();
                }
            }
        }
        return instance;
    }

    public void init() {
        try {
            String storeName = ConfigHolder.getProperty("lt.store.name");
            ServiceProviderLoader loader = new ServiceProviderLoader("lt-store.def");
            store = loader.load(storeName);
            if (store != null) {
                store.init();
            }
        } catch (Exception e) {
            logger.error("", e);
        }

    }

    public IStore getStore() {
        return store;
    }
}
