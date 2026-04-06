package org.xi.lt.server.web.diag.remoting.protocol.payload;

import io.netty.buffer.ByteBuf;
import org.xi.lt.server.web.diag.remoting.protocol.PayloadHolder;

import java.nio.charset.StandardCharsets;

public class RawStringPayloadHolder implements PayloadHolder {
    private final String content;

    public RawStringPayloadHolder(String content) {
        this.content = content;
    }

    @Override
    public void writeBody(ByteBuf out) {
        if (content == null || content.isEmpty()) {
            return;
        }
        out.writeBytes(content.getBytes(StandardCharsets.UTF_8));
    }
}
