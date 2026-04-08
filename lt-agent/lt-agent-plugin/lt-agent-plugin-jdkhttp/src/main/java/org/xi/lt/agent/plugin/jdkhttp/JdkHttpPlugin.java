package org.xi.lt.agent.plugin.jdkhttp;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.jdkhttp.interceptor.JdkHttpAdvice;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import net.bytebuddy.matcher.ElementMatchers;

@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "jdkhttp")
public class JdkHttpPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "jdkhttp";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return ElementMatchers.named("sun.net.www.protocol.http.HttpURLConnection");
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return ElementMatchers.named("connect");
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return JdkHttpAdvice.class;
    }
}
