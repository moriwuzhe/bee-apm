package org.xi.lt.agent.plugin.jdkhttp.handler;

import org.xi.lt.agent.common.HeaderKey;
import org.xi.lt.agent.common.LtTraceContext;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;

import java.net.HttpURLConnection;

public class JdkHttpHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(JdkHttpHandler.class.getSimpleName());

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            if (extVal != null && extVal.length > 0 && extVal[0] instanceof HttpURLConnection) {
                HttpURLConnection connection = (HttpURLConnection) extVal[0];
                boolean alreadySet = false;
                try {
                    alreadySet = connection.getRequestProperty(HeaderKey.GID) != null;
                } catch (IllegalStateException e) {
                    // Already connected
                    alreadySet = true;
                }
                
                if (!alreadySet && !connection.getURL().getPath().contains("api/agent")) {
                    connection.setRequestProperty(HeaderKey.GID, LtTraceContext.getGId());
                    connection.setRequestProperty(HeaderKey.PID, LtTraceContext.getCurrentId());
                    connection.setRequestProperty(HeaderKey.SRC_APP, LtConfig.me().getApp());
                    connection.setRequestProperty(HeaderKey.SRC_INST, LtConfig.me().getInst());
                    if (LtTraceContext.getCTag() != null) {
                        connection.setRequestProperty(HeaderKey.CTAG, LtTraceContext.getCTag());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error injecting trace context to JdkHttp", e);
        }
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        return result;
    }
}
