package org.xi.lt.server.core.handler;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.core.common.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author yuan
 * @date 2018/08/27
 */
@LtPlugin(type = "HANDLER", name = "empty")
public class EmptyStreamHandler extends AbstractStreamHandler {
    private static final Logger logger = LoggerFactory.getLogger(EmptyStreamHandler.class);

    @Override
    public void doInit() throws Exception {
        logger.debug("init .......");
    }

    @Override
    public void handle(Stream stream) throws Exception {
        if (stream != null && stream.getSource() != null) {
            logger.debug("stream : " + stream.getSource().toString());
        } else {
            logger.debug("stream : NULL");
        }
    }
}
