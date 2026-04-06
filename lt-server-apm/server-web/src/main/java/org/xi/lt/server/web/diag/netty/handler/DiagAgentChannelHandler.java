package org.xi.lt.server.web.diag.netty.handler;

import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.xi.lt.server.web.diag.netty.AgentCommandService;
import org.xi.lt.server.web.diag.netty.AgentConnectionStore;
import org.xi.lt.server.web.diag.remoting.protocol.Datagram;
import org.xi.lt.server.web.diag.remoting.protocol.RemotingBuilder;
import org.xi.lt.server.web.diag.remoting.protocol.payload.RawStringPayloadHolder;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@ChannelHandler.Sharable
public class DiagAgentChannelHandler extends SimpleChannelInboundHandler<Datagram> {
    private static final Logger log = LoggerFactory.getLogger(DiagAgentChannelHandler.class);
    private static final int HEARTBEAT_CODE = 0;
    private static final int COMMAND_RESPONSE_CODE = 1001;

    @Autowired
    private AgentConnectionStore store;

    @Autowired
    private AgentCommandService commandService;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Datagram msg) {
        try {
            int code = msg.getHeader() == null ? -1 : msg.getHeader().getCode();
            if (code == HEARTBEAT_CODE) {
                String agentId = readAgentId(msg.getBody(), ctx.channel());
                int version = msg.getHeader().getAgentVersion();
                store.register(agentId, version, ctx.channel());
                ctx.channel().writeAndFlush(RemotingBuilder.buildRequestDatagram(HEARTBEAT_CODE, UUID.randomUUID().toString(), new RawStringPayloadHolder("")));
                return;
            }
            if (code == COMMAND_RESPONSE_CODE) {
                commandService.onDatagram(msg);
                return;
            }
        } finally {
            msg.release();
        }
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        store.remove(ctx.channel());
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.warn("diag agent channel error, remote={}", ctx.channel().remoteAddress(), cause);
        ctx.close();
    }

    private String readAgentId(ByteBuf body, Channel channel) {
        if (body != null && body.isReadable()) {
            String s = body.toString(StandardCharsets.UTF_8);
            if (s != null && !s.trim().isEmpty()) {
                return s.trim();
            }
        }
        InetSocketAddress address = (InetSocketAddress) channel.remoteAddress();
        return address.getAddress().getHostAddress();
    }
}
