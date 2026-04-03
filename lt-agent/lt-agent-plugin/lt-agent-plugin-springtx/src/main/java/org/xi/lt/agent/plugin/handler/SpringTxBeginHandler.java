package org.xi.lt.agent.plugin.handler;

import org.xi.lt.agent.common.SamplingUtil;
import org.xi.lt.agent.common.SpanManager;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.model.SpanType;
import org.xi.lt.agent.plugin.common.SpringTxConfig;
import org.xi.lt.agent.plugin.common.SpringTxContext;
import org.springframework.transaction.TransactionDefinition;

public class SpringTxBeginHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(SpringTxBeginHandler.class.getSimpleName());

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        if (t != null || !SpringTxConfig.me().isEnable() || SamplingUtil.NO()) {
            return result;
        }
        Span span = SpanManager.createLocalSpan(SpanType.SPRING_TX);
        TransactionDefinition definition = (TransactionDefinition) allArguments[1];
        span.addTag("point", definition.getName());
        SpringTxContext.setTxSpan(span);
        logEndTrace(className, methodName, span, log);
        return result;
    }
}
