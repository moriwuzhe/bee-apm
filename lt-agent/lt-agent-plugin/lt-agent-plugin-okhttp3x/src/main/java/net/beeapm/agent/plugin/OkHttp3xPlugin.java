package org.xi.lt.agent.plugin;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.plugin.interceptor.OkHttp3xAdvice;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import net.bytebuddy.matcher.ElementMatchers;

/**
 * @author yuan
 * @date 2018/08/14
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "okhttp3x")
public class OkHttp3xPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "okhttp3x";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return ElementMatchers.named("okhttp3.Request");

                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return ElementMatchers.isConstructor();
                    }
                }
        };
    }


    @Override
    public Class interceptorAdviceClass() {
        return OkHttp3xAdvice.class;
    }
}
