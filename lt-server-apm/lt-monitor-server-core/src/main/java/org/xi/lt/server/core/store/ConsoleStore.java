package org.xi.lt.server.core.store;

import com.alibaba.fastjson.JSON;
import org.xi.lt.common.annotation.LtPlugin;

/**
 * @author yuan
 * @date 2018/11/03
 */
@LtPlugin(type = "STORE", name = "console")
public class ConsoleStore implements IStore {
    @Override
    public void init() {

    }

    @Override
    public void save(Object... streams) {
        if(streams == null){
            return;
        }
        for(Object item : streams){
            System.out.println("[console]==============>"+JSON.toJSONString(item));
        }
    }
}
