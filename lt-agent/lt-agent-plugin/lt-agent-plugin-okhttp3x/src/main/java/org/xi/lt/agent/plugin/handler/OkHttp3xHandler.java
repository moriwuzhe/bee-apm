package org.xi.lt.agent.plugin.handler;

import org.xi.lt.agent.common.LtTraceContext;
import org.xi.lt.agent.common.HeaderKey;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;

/**
 * Created by yuan on 2018/8/14.
 */
public class OkHttp3xHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(OkHttp3xHandler.class.getSimpleName());
    @Override
    public Span before(String className,String methodName, Object[] allArguments,Object[] extVal) {
        try {
            if(allArguments[0] != null && allArguments[0] instanceof okhttp3.Request.Builder){
                okhttp3.Request.Builder builder = (okhttp3.Request.Builder)allArguments[0];
                builder.header(HeaderKey.GID, LtTraceContext.getGId());
                builder.header(HeaderKey.PID,LtTraceContext.getCurrentId());
                builder.header(HeaderKey.SRC_APP, LtConfig.me().getApp());
                builder.header(HeaderKey.SRC_INST, LtConfig.me().getInst());
                if(LtTraceContext.getCTag() != null) {
                    builder.header(HeaderKey.CTAG, LtTraceContext.getCTag());
                }
            }
        }catch (Exception e){
            log.warn("",e);
        }
        return null;
    }

    @Override
    public Object after(String className,String methodName, Object[] allArguments, Object result, Throwable t,Object[] extVal) {
        return result;
    }
}
