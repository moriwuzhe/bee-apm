package org.xi.lt.server.web.diagnostic.remoting.protocol.payloadHolderImpl;

import io.netty.buffer.ByteBuf;
import org.xi.lt.server.web.diagnostic.remoting.protocol.PayloadHolder;

public class ErrorResponsePayloadHolder implements PayloadHolder {
    private final int errorCode;
    private final String message;

    public ErrorResponsePayloadHolder(int errorCode, String message) {
        this.errorCode = errorCode;
        this.message = message;
    }

    public int getErrorCode() {
        return errorCode;
    }

    public String getMessage() {
        return message;
    }

    @Override
    public void writeBody(ByteBuf out) {
        out.writeInt(errorCode);
        byte[] bs = message == null ? new byte[0] : message.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        out.writeInt(bs.length);
        if (bs.length > 0) {
            out.writeBytes(bs);
        }
    }
}
