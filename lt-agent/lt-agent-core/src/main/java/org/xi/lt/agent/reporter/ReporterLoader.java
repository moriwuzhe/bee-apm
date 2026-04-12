package org.xi.lt.agent.reporter;

import org.xi.lt.agent.loader.AbstractLoader;
import java.util.*;
/**
 *
 * @author yuan
 * @date 2018/10/20
 */
public class ReporterLoader extends AbstractLoader {
    public static Map<String, AbstractReporter> loadReporters() {
        return load(new String[]{"reporter"},"lt-reporter.def");
    }
}
