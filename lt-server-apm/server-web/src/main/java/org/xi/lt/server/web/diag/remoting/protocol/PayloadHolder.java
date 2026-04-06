package org.xi.lt.server.web.diag.remoting.protocol;

import io.netty.buffer.ByteBuf;

public interface PayloadHolder {
    void writeBody(ByteBuf out);
}
