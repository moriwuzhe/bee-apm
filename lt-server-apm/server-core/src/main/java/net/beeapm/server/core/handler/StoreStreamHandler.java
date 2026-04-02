package net.beeapm.server.core.handler;

import org.xi.lt.common.annotation.LtPlugin;
import net.beeapm.server.core.common.Stream;
import net.beeapm.server.core.store.IStore;
import net.beeapm.server.core.store.StoreFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * @author yuan
 * @date 2018/08/27
 */
@LtPlugin(type = "HANDLER", name = "store")
public class StoreStreamHandler extends AbstractStreamHandler {
    private static final Logger logger = LoggerFactory.getLogger(StoreStreamHandler.class);
    IStore store;
    @Override
    public void doInit() throws Exception {
        store = StoreFactory.getInstance().getStore();
        logger.debug("init .......");
    }

    @Override
    public void handle(Stream stream) throws Exception {
        Object obj = stream.getSource();
        if(obj.getClass().isArray()){
            store.save((Object[])obj);
        }else {
            store.save(obj);
        }
    }
}
