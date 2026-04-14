package org.xi.lt.server.infrastructure.diag.netty.handler;

import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.xi.lt.server.core.util.ObjectFieldUtils;
import org.xi.lt.server.infrastructure.diag.netty.AgentCommandService;
import org.xi.lt.server.infrastructure.diag.netty.AgentConnectionStore;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.Datagram;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.RemotingBuilder;
import org.xi.lt.server.infrastructure.diag.remoting.protocol.payload.RawStringPayloadHolder;
import org.xi.lt.server.domain.repository.ProjectDao;
import org.xi.lt.server.domain.model.Project;

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

    @Autowired(required=false)
    private ProjectDao projectDao;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Datagram msg) {
        try {
            int code = msg.getHeader() == null ? -1 : msg.getHeader().getCode();
            if (code == HEARTBEAT_CODE) {
                String agentId = readAgentId(msg.getBody(), ctx.channel());
                int version = msg.getHeader().getAgentVersion();
                
                // 鉴权拦截: 验证 projectCode 和 secretKey
                Object props = msg.getHeader().getProperties();
                String projectCode = getString(props, "lt.project");
                String secretKey = getString(props, "lt.secret");

                if (projectCode == null || projectCode.isEmpty() || secretKey == null || secretKey.isEmpty()) {
                    log.warn("Agent Connection Rejected: missing project or secret. AgentId: {}", agentId);
                    ctx.close();
                    return;
                }

                if (projectDao != null) {
                    Project project = projectDao.findByProjectCode(projectCode);
                    if (project == null || !secretKey.equals(project.getSecretKey())) {
                        log.warn("Agent Connection Rejected: invalid project or secret. AgentId: {}, Project: {}", agentId, projectCode);
                        ctx.close();
                        return;
                    }
                }

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

    private static String getString(Object obj, String key) {
        if (obj == null || key == null) return null;
        if (obj instanceof java.util.Map) {
            Object val = ((java.util.Map) obj).get(key);
            return val != null ? String.valueOf(val) : null;
        }
        try {
            java.lang.reflect.Field field = obj.getClass().getDeclaredField(key);
            field.setAccessible(true);
            Object val = field.get(obj);
            return val != null ? String.valueOf(val) : null;
        } catch (Exception ignored) {
            return null;
        }
    }
}
