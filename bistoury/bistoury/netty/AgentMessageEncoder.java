package com.bistoury.netty;

import com.bistoury.entity.AgentMessage;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;

import java.nio.charset.StandardCharsets;

/**
 * Agent消息编码器
 */
public class AgentMessageEncoder extends MessageToByteEncoder<AgentMessage> {

    @Override
    protected void encode(ChannelHandlerContext ctx, AgentMessage msg, ByteBuf out) throws Exception {
        // 写入魔数
        out.writeInt(AgentMessage.MAGIC_CODE);
        // 写入消息类型
        out.writeInt(msg.getType());
        // 写入请求ID
        out.writeLong(msg.getRequestId());

        // 写入agentId
        byte[] agentIdBytes = msg.getAgentId().getBytes(StandardCharsets.UTF_8);
        out.writeInt(agentIdBytes.length);
        out.writeBytes(agentIdBytes);

        // 写入appName
        byte[] appNameBytes = msg.getAppName().getBytes(StandardCharsets.UTF_8);
        out.writeInt(appNameBytes.length);
        out.writeBytes(appNameBytes);

        // 写入hostIp
        byte[] hostIpBytes = msg.getHostIp().getBytes(StandardCharsets.UTF_8);
        out.writeInt(hostIpBytes.length);
        out.writeBytes(hostIpBytes);

        // 写入pid
        out.writeInt(msg.getPid());

        // 写入body
        if (msg.getBody() != null) {
            out.writeInt(msg.getBody().length);
            out.writeBytes(msg.getBody());
        } else {
            out.writeInt(0);
        }
    }
}
