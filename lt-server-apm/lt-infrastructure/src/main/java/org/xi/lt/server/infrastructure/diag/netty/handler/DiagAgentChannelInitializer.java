package org.xi.lt.server.infrastructure.diag.netty.handler;

import io.netty.channel.ChannelInitializer;
import io.netty.channel.socket.SocketChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import org.xi.lt.server.infrastructure.diag.remoting.coder.AgentDecoder;
import org.xi.lt.server.infrastructure.diag.remoting.coder.AgentEncoder;

@Component
public class DiagAgentChannelInitializer extends ChannelInitializer<SocketChannel> {
    private final AgentEncoder encoder = new AgentEncoder();

    @Autowired
    private DiagAgentChannelHandler handler;

    @Override
    protected void initChannel(SocketChannel ch) {
        ch.pipeline().addLast("frameDecoder", new LengthFieldBasedFrameDecoder(1024 * 1024, 0, 4, 0, 0));
        ch.pipeline().addLast("decoder", new AgentDecoder());
        ch.pipeline().addLast("encoder", encoder);
        ch.pipeline().addLast("handler", handler);
    }
}
