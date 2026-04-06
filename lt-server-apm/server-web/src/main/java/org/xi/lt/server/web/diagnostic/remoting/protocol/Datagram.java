package org.xi.lt.server.web.diagnostic.remoting.protocol;

import io.netty.buffer.ByteBuf;
import io.netty.util.ReferenceCountUtil;

public class Datagram {
    private RemotingHeader header;
    private ByteBuf body;
    private PayloadHolder holder;

    public ByteBuf getBody() {
        return body;
    }

    public void setBody(ByteBuf body) {
        this.body = body;
    }

    public void setPayloadHolder(PayloadHolder holder) {
        this.holder = holder;
    }

    public PayloadHolder getHolder() {
        return holder;
    }

    public RemotingHeader getHeader() {
        return header;
    }

    public void setHeader(RemotingHeader header) {
        this.header = header;
    }

    public void writeBody(ByteBuf out) {
        if (holder == null) return;
        holder.writeBody(out);
    }

    public void release() {
        ReferenceCountUtil.safeRelease(body);
    }

    @Override
    public String toString() {
        return "Datagram{" +
                "header=" + header +
                '}';
    }
}
