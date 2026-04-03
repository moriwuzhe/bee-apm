package org.xi.lt.agent.plugin.thread.wrapper;

import org.xi.lt.agent.common.BeeTraceContext;
import org.xi.lt.agent.model.TraceContextModel;

import java.util.concurrent.Callable;

/**
 * @author yuan
 * @date 2020/05/28
 */
public class BeeCallableWrapper<T> implements Callable<T> {
    private Callable<T> callable;

    private TraceContextModel contextModel;

    public BeeCallableWrapper(Callable<T> callable, TraceContextModel contextModel) {
        this.callable = callable;
        this.contextModel = contextModel;
    }

    @Override
    public T call() throws Exception {
        BeeTraceContext.set(contextModel);
        return callable.call();
    }

    /**
     * 返回原始的Callable
     * @return
     */
    public Callable<T> getOrigin() {
        return callable;
    }
}
