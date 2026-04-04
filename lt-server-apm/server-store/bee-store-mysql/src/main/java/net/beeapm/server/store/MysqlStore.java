package org.xi.lt.server.store;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.server.core.store.IStore;
import org.xi.lt.server.store.mysql.MysqlUtils;
/**
 * @author kaddddd
 * @date 2018/11/17
 */
@LtPlugin(type = "STORE",name = "mysql")
public class MysqlStore implements IStore {
    @Override
    public void init() {
        System.out.println("Mysql5xStore init ......................");
        MysqlUtils.inst();
    }

    @Override
    public void save(Object ... datas) {
        MysqlUtils.insert(datas);
    }
}
