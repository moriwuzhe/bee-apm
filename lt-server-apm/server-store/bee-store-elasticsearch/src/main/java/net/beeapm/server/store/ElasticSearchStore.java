package net.beeapm.server.store;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import net.beeapm.server.core.store.IStore;
import net.beeapm.server.store.jest.JestUtils;

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
}
