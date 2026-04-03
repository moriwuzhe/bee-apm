package com.bistoury.netty;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/**
 * Agent Netty服务端，监听Agent连接，端口默认3333
 */
@Slf4j
@Component
public class AgentServer {

    @Value("${agent.server.port:3333}")
    private int port;

    @Autowired
    private AgentMessageDecoder agentMessageDecoder;

    @Autowired
    private AgentMessageEncoder agentMessageEncoder;

    @Autowired
    private AgentServerHandler agentServerHandler;

    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;
    private ChannelFuture channelFuture;

    @PostConstruct
    public void start() throws Exception {
        bossGroup = new NioEventLoopGroup(1);
        workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline()
                                    .addLast(agentMessageDecoder)
                                    .addLast(agentMessageEncoder)
                                    .addLast(agentServerHandler);
                        }
                    });

            channelFuture = b.bind(port).sync();
            log.info("Agent Netty Server started on port {}", port);
        } catch (Exception e) {
            log.error("Agent Netty Server start failed: {}", e.getMessage(), e);
            stop();
        }
    }

    @PreDestroy
    public void stop() throws Exception {
        log.info("Stopping Agent Netty Server...");
        if (channelFuture != null) {
            channelFuture.channel().close().sync();
        }
        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }
        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }
        log.info("Agent Netty Server stopped.");
    }
}
