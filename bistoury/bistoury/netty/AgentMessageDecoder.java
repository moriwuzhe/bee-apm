package com.bistoury.netty;

import com.bistoury.entity.AgentMessage;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Agent消息解码器，兼容原有Bistoury Agent协议格式
 */
@Slf4j
public class AgentMessageDecoder extends ByteToMessageDecoder {

    private static final int MIN_FRAME_LENGTH = 4 + 4 + 8 + 4 + 4 + 4 + 4 + 4; // 最小长度

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        // 检查是否有足够的字节读取魔数
        if (in.readableBytes() < 4) {
            return;
        }

        // 标记当前读指针位置
        in.markReaderIndex();

        // 读取魔数
        int magic = in.readInt();
        if (magic != AgentMessage.MAGIC_CODE) {
            log.error("Invalid magic code: 0x{}", Integer.toHexString(magic));
            in.resetReaderIndex();
            ctx.close();
            return;
        }

        // 检查是否有足够的字节读取头部
        if (in.readableBytes() < MIN_FRAME_LENGTH - 4) {
            in.resetReaderIndex();
            return;
        }

        // 读取消息头部
        AgentMessage message = new AgentMessage();
        message.setType(in.readInt());
        message.setRequestId(in.readLong());

        // 读取agentId
        int agentIdLen = in.readInt();
        if (in.readableBytes() < agentIdLen) {
            in.resetReaderIndex();
            return;
        }
        byte[] agentIdBytes = new byte[agentIdLen];
        in.readBytes(agentIdBytes);
        message.setAgentId(new String(agentIdBytes, StandardCharsets.UTF_8));

        // 读取appName
        int appNameLen = in.readInt();
        if (in.readableBytes() < appNameLen) {
            in.resetReaderIndex();
            return;
        }
        byte[] appNameBytes = new byte[appNameLen];
        in.readBytes(appNameBytes);
        message.setAppName(new String(appNameBytes, StandardCharsets.UTF_8));

        // 读取hostIp
        int hostIpLen = in.readInt();
        if (in.readableBytes() < hostIpLen) {
            in.resetReaderIndex();
            return;
        }
        byte[] hostIpBytes = new byte[hostIpLen];
        in.readBytes(hostIpBytes);
        message.setHostIp(new String(hostIpBytes, StandardCharsets.UTF_8));

        // 读取pid
        message.setPid(in.readInt());

        // 读取body
        int bodyLen = in.readInt();
        if (in.readableBytes() < bodyLen) {
            in.resetReaderIndex();
            return;
        }
        byte[] body = new byte[bodyLen];
        in.readBytes(body);
        message.setBody(body);
        message.setBodyLength(bodyLen);

        out.add(message);
    }
}
