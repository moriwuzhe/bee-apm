package org.xi.lt.server.infrastructure.store;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.server.domain.repository.IStore;
import org.xi.lt.server.infrastructure.store.h2.H2Utils;

/**
 * H2数据库存储实现
 */
@LtPlugin(type = "STORE", name = "h2")
public class H2Store implements IStore {
    @Override
    public void init() {
        System.out.println("H2Store init ......................");
        H2Utils.inst();
    }

    @Override
    public void save(Object... datas) {
        H2Utils.inst().insert(datas);
    }

    @Override
    public void clean(int retentionDays) {
        H2Utils.inst().cleanOldData(retentionDays);
    }
}
