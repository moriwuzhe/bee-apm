package org.xi.lt.agent.plugin.handler;

import org.xi.lt.agent.common.SamplingUtil;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.common.SpringTxConfig;
import org.xi.lt.agent.plugin.common.SpringTxContext;
import org.xi.lt.agent.reporter.ReporterFactory;

public class SpringTxEndHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog(SpringTxEndHandler.class.getSimpleName());
    @Override
    public Span before(String className, String methodName, Object[] allArguments,Object[] extVal)  {
        if(!SpringTxConfig.me().isEnable() || SamplingUtil.NO()){
            return null;
        }
        Span span = SpringTxContext.getTxSpan();
        SpringTxContext.remove();
        if(span != null) {
            calculateSpend(span);
            if(span.getSpend() > SpringTxConfig.me().getSpend()) {
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        }
        return span;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal){
        return result;
    }
}
