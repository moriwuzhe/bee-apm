package org.xi.lt.agent.plugin;


import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.plugin.interceptor.SpringTxEndAdvice;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import net.bytebuddy.matcher.ElementMatchers;

/**
 * @author kaddddd
 * @date 2018/08/22
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "springTxEnd")
public class SpringTxEndPlugin extends AbstractPlugin {
    @Override
    public String getName() {
        return "springTxEnd";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return ElementMatchers.named("org.springframework.jdbc.datasource.DataSourceTransactionManager");
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return ElementMatchers.isMethod()
                                .and(ElementMatchers.<MethodDescription>named("doCleanupAfterCompletion")
                        );
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return SpringTxEndAdvice.class;
    }
}
