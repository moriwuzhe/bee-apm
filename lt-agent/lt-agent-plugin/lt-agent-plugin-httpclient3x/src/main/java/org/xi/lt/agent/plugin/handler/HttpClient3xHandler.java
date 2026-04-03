package org.xi.lt.agent.plugin.handler;

import org.xi.lt.agent.common.BeeTraceContext;
import org.xi.lt.agent.common.HeaderKey;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.apache.commons.httpclient.HttpMethod;

/**
 * Created by yuan on 2018/8/16.
 */
public class HttpClient3xHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(HttpClient3xHandler.class.getSimpleName());
    @Override
    public Span before(String className,String methodName, Object[] allArguments,Object[] extVal) {
        try {
            for (int i = 0; i < allArguments.length; i++) {
                if (allArguments[i] instanceof HttpMethod) {
                    HttpMethod req = (HttpMethod) allArguments[i];
                    if(req.getRequestHeader(HeaderKey.GID) == null){
                        req.setRequestHeader(HeaderKey.GID, BeeTraceContext.getGId());
                        req.setRequestHeader(HeaderKey.PID,BeeTraceContext.getCurrentId());
                        req.setRequestHeader(HeaderKey.CTAG,BeeTraceContext.getCTag());
                        req.setRequestHeader(HeaderKey.SRC_APP, BeeConfig.me().getApp());
                        req.setRequestHeader(HeaderKey.SRC_INST, BeeConfig.me().getInst());
                    }
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
