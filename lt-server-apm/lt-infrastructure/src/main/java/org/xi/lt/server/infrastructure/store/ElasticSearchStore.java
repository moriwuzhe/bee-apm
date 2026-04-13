package org.xi.lt.server.infrastructure.store;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.server.core.store.IStore;
import org.xi.lt.server.infrastructure.store.jest.JestUtils;

/**
 * @author yuan
 * @date 2018/08/23
 */
@LtPlugin(type = "STORE", name = "elasticsearch")
public class ElasticSearchStore implements IStore {
    @Override
    public void init() {
        System.out.println("ElasticSearchStore init ......................");
        JestUtils.inst();
    }

    @Override
    public void save(Object... datas) {
        JestUtils.inst().insert(datas);
    }

    @Override
    public void clean(int retentionDays) {
        JestUtils.inst().cleanOldIndices(retentionDays);
    }
}
