package org.xi.lt.agent.plugin.common;

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author yuan
 * @date 2019/12/27
 */
public class LtHttpServletRequestWrapper extends HttpServletRequestWrapper {
    private final HttpServletRequest originalRequest;
    private byte[] body = new byte[0];
    private final ByteArrayOutputStream cachedBytes = new ByteArrayOutputStream();

    public LtHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
        this.originalRequest = request;
    }

    @Override
    public BufferedReader getReader() throws IOException {
        return new BufferedReader(new InputStreamReader(getInputStream(), getCharacterEncoding() != null ? getCharacterEncoding() : "UTF-8"));
    }

    public byte[] getBody() {
        return cachedBytes.toByteArray();
    }

    @Override
    public ServletInputStream getInputStream() throws IOException {
        final ServletInputStream originalInputStream = super.getInputStream();

        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return originalInputStream.isFinished();
            }

            @Override
            public boolean isReady() {
                return originalInputStream.isReady();
            }

            @Override
            public void setReadListener(ReadListener readListener) {
                originalInputStream.setReadListener(readListener);
            }

            @Override
            public int read() throws IOException {
                int ch = originalInputStream.read();
                if (ch != -1) {
                    cachedBytes.write(ch);
                }
                return ch;
            }

            @Override
            public int read(byte[] b, int off, int len) throws IOException {
                int count = originalInputStream.read(b, off, len);
                if (count != -1) {
                    cachedBytes.write(b, off, count);
                }
                return count;
            }
        };
    }
}
