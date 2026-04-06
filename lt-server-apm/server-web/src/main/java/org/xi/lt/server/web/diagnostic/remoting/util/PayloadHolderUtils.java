package org.xi.lt.server.web.diagnostic.remoting.util;

import com.google.common.base.Charsets;
import io.netty.buffer.ByteBuf;

public class PayloadHolderUtils {
    public static String readString(ByteBuf in) {
        short len = in.readShort();
        if (len <= 0) {
            return "";
        }
        byte[] bs = new byte[len];
        in.readBytes(bs);
        return new String(bs, Charsets.UTF_8);
    }

    public static void writeString(String data, ByteBuf out) {
        if (data == null || data.isEmpty()) {
            out.writeShort(0);
            return;
        }
        byte[] bs = data.getBytes(Charsets.UTF_8);
        out.writeShort((short) bs.length);
        out.writeBytes(bs);
    }
}
