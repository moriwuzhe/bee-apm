package org.xi.lt.server.infrastructure.stream;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.core.stream.AbstractStreamProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author yuan
 * @date 2018/08/27
 */
@LtPlugin(type = "STREAM", name = "servlet")
public class ServletStreamProvider extends AbstractStreamProvider {
    private static final Logger logger = LoggerFactory.getLogger(ServletStreamProvider.class);

    @Override
    public void start() {
        logger.info("ServletStreamProvider start ............................................");
    }
}
