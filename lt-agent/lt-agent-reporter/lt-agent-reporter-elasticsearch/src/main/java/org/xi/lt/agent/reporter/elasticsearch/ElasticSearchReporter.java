package org.xi.lt.agent.reporter.elasticsearch;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.reporter.AbstractReporter;

import java.util.List;

/**
 * @author yuan
 * @date 2018/08/13
 */
@LtPlugin(type = LtPluginType.REPORTER, name = "elasticsearch")
public class ElasticSearchReporter extends AbstractReporter {
    @Override
    public int report(Span span) {
        return 0;
    }

    @Override
    public int report(List<Span> span) {
        return 0;
    }

    @Override
    public int init() {
        return 0;
    }
}
