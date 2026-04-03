package com.bistoury.netty;

import com.bistoury.entity.AgentInfo;
import com.bistoury.entity.AgentMessage;
import com.bistoury.service.AgentService;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.util.Date;
import java.util.UUID;

/**
 * Agent消息业务处理器
 */
@Slf4j
@Component
@ChannelHandler.Sharable
public class AgentServerHandler extends SimpleChannelInboundHandler<AgentMessage> {

    @Autowired
    private AgentService agentService;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, AgentMessage msg) throws Exception {
        log.info("Received agent message: type={}, appName={}, hostIp={}, pid={}",
                msg.getType(), msg.getAppName(), msg.getHostIp(), msg.getPid());

        switch (msg.getType()) {
            case AgentMessage.TYPE_REGISTER:
                handleRegister(ctx, msg);
                break;
            case AgentMessage.TYPE_HEARTBEAT:
                handleHeartbeat(ctx, msg);
                break;
            case AgentMessage.TYPE_RESPONSE:
                handleResponse(ctx, msg);
                break;
            default:
                log.warn("Unknown message type: {}", msg.getType());
        }
    }

    /**
     * 处理Agent注册请求
     */
    private void handleRegister(ChannelHandlerContext ctx, AgentMessage msg) {
        // 生成唯一agentId
        String agentId = UUID.randomUUID().toString().replace("-", "");

        // 保存Agent信息
        AgentInfo agentInfo = new AgentInfo();
        agentInfo.setAgentId(agentId);
        agentInfo.setAppName(msg.getAppName());
        agentInfo.setHostIp(msg.getHostIp());
        agentInfo.setPid(msg.getPid());
        agentInfo.setClientIp(((InetSocketAddress) ctx.channel().remoteAddress()).getAddress().getHostAddress());
        agentInfo.setStatus(AgentInfo.STATUS_ONLINE);
        agentInfo.setLastHeartbeatTime(new Date());
        agentInfo.setChannel(ctx.channel());

        agentService.registerAgent(agentInfo);

        // 返回注册响应
        AgentMessage response = new AgentMessage();
        response.setType(AgentMessage.TYPE_RESPONSE);
        response.setRequestId(msg.getRequestId());
        response.setAgentId(agentId);
        response.setAppName(msg.getAppName());
        response.setHostIp(msg.getHostIp());
        response.setPid(msg.getPid());
        response.setBody("success".getBytes());

        ctx.writeAndFlush(response);
        log.info("Agent registered successfully: agentId={}, appName={}", agentId, msg.getAppName());
    }

    /**
     * 处理Agent心跳请求
     */
    private void handleHeartbeat(ChannelHandlerContext ctx, AgentMessage msg) {
        agentService.heartbeat(msg.getAgentId());

        // 返回心跳响应
        AgentMessage response = new AgentMessage();
        response.setType(AgentMessage.TYPE_RESPONSE);
        response.setRequestId(msg.getRequestId());
        response.setAgentId(msg.getAgentId());
        response.setAppName(msg.getAppName());
        response.setHostIp(msg.getHostIp());
        response.setPid(msg.getPid());
        response.setBody("ok".getBytes());

        ctx.writeAndFlush(response);
        log.debug("Agent heartbeat received: agentId={}", msg.getAgentId());
    }

    /**
     * 处理Agent响应消息
     */
    private void handleResponse(ChannelHandlerContext ctx, AgentMessage msg) {
        // 这里处理命令执行结果，后续对接前端WebSocket推送
        log.info("Received agent response: requestId={}, bodyLength={}", msg.getRequestId(), msg.getBodyLength());
        // TODO: 存储命令执行结果，推送给前端
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        log.info("Agent connected: {}", ctx.channel().remoteAddress());
        super.channelActive(ctx);
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        log.info("Agent disconnected: {}", ctx.channel().remoteAddress());
        // 标记Agent为离线
        agentService.agentOffline(ctx.channel());
        super.channelInactive(ctx);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        log.error("Agent connection error: {}", cause.getMessage(), cause);
        ctx.close();
    }
}
