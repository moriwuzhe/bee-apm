package org.xi.lt.server.infrastructure.diag.remoting.protocol.payload;

import io.netty.buffer.ByteBuf;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.PayloadHolder;
import org.xi.lt.server.infrastructure.diag.remoting.util.PayloadHolderUtils;

public class RequestPayloadHolder implements PayloadHolder {
    private final String content;

    public RequestPayloadHolder(String content) {
        this.content = content;
    }

    @Override
    public void writeBody(ByteBuf out) {
        PayloadHolderUtils.writeString(content, out);
    }
}
