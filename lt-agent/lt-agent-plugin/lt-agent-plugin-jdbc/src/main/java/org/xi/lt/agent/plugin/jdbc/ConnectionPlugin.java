package org.xi.lt.agent.plugin.jdbc;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.common.PluginOrder; 
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.jdbc.interceptor.ConnectionAdvice;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import net.bytebuddy.matcher.ElementMatchers;

/**
 * @author yuan
 * @date 2018/08/14
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "jdbc-connection")
public class ConnectionPlugin extends AbstractPlugin {
    @Override
    public String getName() {
        return "jdbc-connection";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return ElementMatchers.isSubTypeOf (java.sql.Connection.class)
                                .and(ElementMatchers.not(ElementMatchers.isInterface()))
                                .and(ElementMatchers.not(ElementMatchers.<TypeDescription>isAbstract()))
                                .and(ElementMatchers.not(ElementMatchers.<TypeDescription>nameStartsWith("com.sun")));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return ElementMatchers.isMethod()
                                .and(ElementMatchers.<MethodDescription>named("prepareStatement")
                                        .or(ElementMatchers.<MethodDescription>named("prepareCall"))
                        );
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return ConnectionAdvice.class;
    }

    @Override
    public int order(){
        return PluginOrder.CONNECTION_PLUGIN;
    }
}
