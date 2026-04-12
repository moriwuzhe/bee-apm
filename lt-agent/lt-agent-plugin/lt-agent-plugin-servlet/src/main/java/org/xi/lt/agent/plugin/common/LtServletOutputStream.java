package org.xi.lt.agent.plugin.common;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;
import java.io.ByteArrayOutputStream;

/**
 * @author yuan
 * @date 2019/12/27
 */
public class LtServletOutputStream extends ServletOutputStream {
    private ByteArrayOutputStream output;

    public LtServletOutputStream(ByteArrayOutputStream output) {
        this.output = output;
    }

    @Override
    public void write(int b) {
        // 将数据写到stream中
        output.write(b);
    }

    @Override
    public boolean isReady() {
        return false;
    }

    @Override
    public void setWriteListener(WriteListener writeListener) {
    }
}
