package org.xi.lt.agent.plugin.thread.wrapper;

import org.xi.lt.agent.common.BeeTraceContext;
import org.xi.lt.agent.common.BeeUtils;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.TraceContextModel;

import java.lang.reflect.Method;
import java.util.List;
import java.util.concurrent.ForkJoinTask;

/**
 * @author yuan
 * @date 2020/05/29
 */
public class BeeForkJoinTaskWrapper<V> extends ForkJoinTask<V> {
    private static ILog log = LogFactory.getLog(BeeForkJoinTaskWrapper.class);
    private ForkJoinTask<V> task;
    private TraceContextModel contextModel;
    private static Method setRawResultMethod;
    private static Method execMethod;
    private static List<Method> taskMethodList;

    public BeeForkJoinTaskWrapper(ForkJoinTask<V> task, TraceContextModel contextModel) {
        this.task = task;
        this.contextModel = contextModel;
    }

    @Override
    public V getRawResult() {
        return task.getRawResult();
    }

    @Override
    protected void setRawResult(V value) {
        if (setRawResultMethod == null) {
            setRawResultMethod = getMethod("setRawResult");
        }
        try {
            setRawResultMethod.setAccessible(true);
            setRawResultMethod.invoke(task, value);
        } catch (Throwable e) {
            throw new RuntimeException("反射执行setRawResult方法失败", e);
        }
    }

    @Override
    protected boolean exec() {
        BeeTraceContext.set(contextModel);
        if (execMethod == null) {
            execMethod = getMethod("exec");
        }
        try {
            execMethod.setAccessible(true);
            return (Boolean) execMethod.invoke(task);
        } catch (Throwable e) {
            throw new RuntimeException("反射执行exec方法失败", e);
        }
    }

    private Method getMethod(String name) {
        if (taskMethodList == null) {
            taskMethodList = BeeUtils.getAllMethod(task.getClass());
        }
        for (Method m : taskMethodList) {
            if (m.getName().equals(name)) {
                return m;
            }
        }
        return null;
    }
}
