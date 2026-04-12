package org.xi.lt.server.web.diagnostic.remoting.protocol.payloadHolderImpl;

import io.netty.buffer.ByteBuf;
import org.xi.lt.server.web.diagnostic.remoting.protocol.PayloadHolder;
import org.xi.lt.server.web.diagnostic.remoting.util.PayloadHolderUtils;

public class RequestPayloadHolder implements PayloadHolder {
    private final String content;

    public RequestPayloadHolder(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    @Override
    public void writeBody(ByteBuf out) {
        PayloadHolderUtils.writeString(content, out);
    }
}
