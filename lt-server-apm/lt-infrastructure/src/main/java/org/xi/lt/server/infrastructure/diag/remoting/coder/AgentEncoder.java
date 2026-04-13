package org.xi.lt.server.infrastructure.diag.remoting.coder;

import com.google.common.base.Strings;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.Datagram;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.RemotingHeader;
import org.xi.lt.server.infrastructure.diag.remoting.util.JsonUtils;
import org.xi.lt.server.infrastructure.diag.remoting.util.PayloadHolderUtils;

import java.util.Map;

@ChannelHandler.Sharable
public class AgentEncoder extends MessageToByteEncoder<Datagram> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Datagram msg, ByteBuf out) throws Exception {
        int start = out.writerIndex();
        int headerStart = start + RemotingHeader.LENGTH_FIELD;
        out.ensureWritable(RemotingHeader.LENGTH_FIELD);
        out.writerIndex(headerStart);

        RemotingHeader header = msg.getHeader();
        encodeHeader(header, out);

        int headerSize = out.writerIndex() - headerStart;
        msg.writeBody(out);

        int end = out.writerIndex();
        int total = end - start - RemotingHeader.TOTAL_SIZE_LEN;

        out.writerIndex(start);
        out.writeInt(total);
        out.writeShort(headerSize);
        out.writerIndex(end);
    }

    private void encodeHeader(final RemotingHeader header, ByteBuf out) {
        out.writeInt(header.getMagicCode());
        out.writeShort(header.getVersion());
        out.writeShort(header.getAgentVersion());
        PayloadHolderUtils.writeString(Strings.nullToEmpty(header.getId()), out);
        out.writeInt(header.getCode());
        out.writeInt(header.getFlag());
        Object properties = header.getProperties();
        if (properties instanceof java.util.Map && !((java.util.Map) properties).isEmpty()) {
            String data = JsonUtils.toJson(properties);
            PayloadHolderUtils.writeString(data, out);
        } else {
            out.writeShort(0);
        }
    }
}
