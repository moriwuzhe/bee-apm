package org.xi.lt.server.web.infrastructure.diag.netty;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.xi.lt.server.web.infrastructure.diag.netty.handler.DiagAgentChannelInitializer;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class DiagAgentNettyServer {
    @Value("${diag.agent.port:${agent.port:3333}}")
    int port;

    @Autowired
    private DiagAgentChannelInitializer initializer;

    private EventLoopGroup boss;
    private EventLoopGroup worker;
    private Channel channel;

    @PostConstruct
    public void start() throws InterruptedException {
        Runtime.getRuntime().addShutdownHook(new Thread(this::stop));
        boss = new NioEventLoopGroup(1);
        worker = new NioEventLoopGroup();
        ServerBootstrap b = new ServerBootstrap();
        b.group(boss, worker)
                .channel(NioServerSocketChannel.class)
                .childHandler(initializer)
                .childOption(ChannelOption.TCP_NODELAY, true)
                .childOption(ChannelOption.SO_KEEPALIVE, true);
        channel = b.bind(port).sync().channel();
    }

    @PreDestroy
    public void stop() {
        if (channel != null) {
            channel.close();
        }
        if (worker != null) {
            worker.shutdownGracefully();
        }
        if (boss != null) {
            boss.shutdownGracefully();
        }
    }
}
