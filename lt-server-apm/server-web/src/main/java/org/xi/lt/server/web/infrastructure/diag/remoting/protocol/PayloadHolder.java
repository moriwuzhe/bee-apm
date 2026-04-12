package org.xi.lt.server.web.infrastructure.diag.remoting.protocol;

import io.netty.buffer.ByteBuf;

public interface PayloadHolder {
    void writeBody(ByteBuf out);
}
