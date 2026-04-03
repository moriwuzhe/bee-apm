package org.xi.lt.agent.plugin.jdbc.handler;

import org.xi.lt.agent.common.BeeTraceContext;
import org.xi.lt.agent.common.SamplingUtil;
import org.xi.lt.agent.common.SpanManager;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.model.SpanType;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.plugin.jdbc.JdbcConfig;
import org.xi.lt.agent.plugin.jdbc.common.JdbcContext;

public class ConnectionHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(ConnectionHandler.class.getSimpleName());
    @Override
    public Span before(String className, String methodName, Object[] allArguments,Object[] extVal) {
        if(!JdbcConfig.me().isEnable() || SamplingUtil.NO()){
            return null;
        }
        Span span = JdbcContext.getJdbcSpan();
        String gid = BeeTraceContext.getGId();
        //如果gid相等，那么调用过名称相同参数签名不一样的方法，属于二次调用,不需要再采集了
        if(span == null || !gid.equals(span.getGid())) {
            span = SpanManager.createLocalSpan(SpanType.SQL);
            JdbcContext.setJdbcSpan(span);
            span.addTag("sql", allArguments[0]);
        }
        return span;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t,Object[] extVal) {
        if(t != null){
            JdbcContext.remove();
        }
        return result;
    }
}
