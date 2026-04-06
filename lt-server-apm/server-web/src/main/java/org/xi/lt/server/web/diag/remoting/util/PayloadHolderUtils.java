package org.xi.lt.server.web.diag.remoting.util;

import io.netty.buffer.ByteBuf;

import java.nio.charset.StandardCharsets;

public class PayloadHolderUtils {
    public static String readString(ByteBuf in) {
        short len = in.readShort();
        if (len <= 0) {
            return "";
        }
        byte[] bs = new byte[len];
        in.readBytes(bs);
        return new String(bs, StandardCharsets.UTF_8);
    }

    public static void writeString(String data, ByteBuf out) {
        if (data == null || data.isEmpty()) {
            out.writeShort(0);
            return;
        }
        byte[] bs = data.getBytes(StandardCharsets.UTF_8);
        out.writeShort((short) bs.length);
        out.writeBytes(bs);
    }
}
