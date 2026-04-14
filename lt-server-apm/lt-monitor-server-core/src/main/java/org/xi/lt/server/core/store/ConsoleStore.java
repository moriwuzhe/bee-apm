package org.xi.lt.server.core.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.domain.repository.IStore;

/**
 * @author yuan
 * @date 2018/11/03
 */
@LtPlugin(type = "STORE", name = "console")
public class ConsoleStore implements IStore {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void init() {

    }

    @Override
    public void save(Object... streams) {
        if(streams == null){
            return;
        }
        for(Object item : streams){
            try {
                System.out.println("[console]==============>" + OBJECT_MAPPER.writeValueAsString(item));
            } catch (Exception e) {
                System.out.println("[console]==============>" + item);
            }
        }
    }
}
