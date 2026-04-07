package org.xi.lt.agent.reporter;

import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.model.Span;
import java.util.List;

/**
 * 控制台输出Reporter，用于调试
 * @author LT Monitor Dev
 * @date 2026/04/01
 */
public class ConsoleReporter extends AbstractReporter {

    @Override
    public int init() {
        LogUtil.log("ConsoleReporter initialized");
        return 0;
    }

    @Override
    public int report(Span span) {
        LogUtil.log("收到上报单条Span：id=" + span.getId() + ", type=" + span.getType() + ", spend=" + span.getSpend() + "ms");
        return 0;
    }

    @Override
    public int report(List<Span> spanList) {
        LogUtil.log("收到上报Span：" + spanList.size() + "条");
        for (Span span : spanList) {
            LogUtil.log("Span: id=" + span.getId() + ", type=" + span.getType() + ", spend=" + span.getSpend() + "ms");
        }
        return 0;
    }
}
