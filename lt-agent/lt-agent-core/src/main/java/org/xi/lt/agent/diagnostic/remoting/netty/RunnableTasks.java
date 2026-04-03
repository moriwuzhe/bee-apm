package org.xi.lt.agent.diagnostic.remoting.netty;

import org.xi.lt.agent.diagnostic.agent.common.job.ResponseJobStore;

/**
 * @author zhenyu.nie created on 2019 2019/10/30 15:50
 */
public class RunnableTasks {

    public static RunnableTask wrap(ResponseJobStore jobStore, Task task) {
        return new DefaultRunningTask(jobStore, task);
    }
}
