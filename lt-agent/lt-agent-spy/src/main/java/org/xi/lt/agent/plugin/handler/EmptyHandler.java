package org.xi.lt.agent.plugin.handler;


import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.model.Span;

/**
 * @author yuan
 * @date 2018/7/30
 */
public class EmptyHandler extends AbstractHandler {
    private Span emptySpan = new Span("empty");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        LogUtil.getEmptyHandlerLog().trace("[begin]{}.{} type={}", className, methodName, emptySpan.getType());
        return emptySpan;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        LogUtil.getEmptyHandlerLog().trace("[end]{}.{} type={}", className, methodName, emptySpan.getType());
        return result;
    }

}
