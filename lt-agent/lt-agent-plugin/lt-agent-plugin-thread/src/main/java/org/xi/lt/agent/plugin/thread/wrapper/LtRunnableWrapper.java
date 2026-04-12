package org.xi.lt.agent.plugin.thread.wrapper;

import org.xi.lt.agent.common.LtTraceContext;
import org.xi.lt.agent.model.TraceContextModel;

/**
 * @author yuan
 * @date 2020/05/28
 */
public class LtRunnableWrapper implements Runnable {
    private Runnable runnable;
    private TraceContextModel contextModel;

    public LtRunnableWrapper(Runnable runnable,TraceContextModel contextModel) {
        this.runnable = runnable;
        this.contextModel = contextModel;
    }

    @Override
    public void run() {
        LtTraceContext.set(contextModel);
        runnable.run();
    }

    /**
     * 返回原始的Runnable
     * @return
     */
    public Runnable getOrigin() {
        return runnable;
    }
}
