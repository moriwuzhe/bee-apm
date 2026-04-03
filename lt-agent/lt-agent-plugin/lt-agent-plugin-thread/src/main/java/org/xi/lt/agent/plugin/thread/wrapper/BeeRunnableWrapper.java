package org.xi.lt.agent.plugin.thread.wrapper;

import org.xi.lt.agent.common.BeeTraceContext;
import org.xi.lt.agent.model.TraceContextModel;

/**
 * @author yuan
 * @date 2020/05/28
 */
public class BeeRunnableWrapper implements Runnable {
    private Runnable runnable;
    private TraceContextModel contextModel;

    public BeeRunnableWrapper(Runnable runnable,TraceContextModel contextModel) {
        this.runnable = runnable;
        this.contextModel = contextModel;
    }

    @Override
    public void run() {
        BeeTraceContext.set(contextModel);
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
