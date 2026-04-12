package org.xi.lt.agent.plugin;

import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.config.ConfigUtils;
import org.xi.lt.agent.plugin.interceptor.ServletAdvice;
import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import net.bytebuddy.matcher.ElementMatchers;

import java.util.List;

/**
 * @author yuan
 * @date 2018/08/05
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "servlet")
public class ServletPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "servlet";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        ElementMatcher.Junction<TypeDescription> matcher = ElementMatchers.hasSuperType(ElementMatchers.named("javax.servlet.http.HttpServlet"))
                                .and(ElementMatchers.not(ElementMatchers.<TypeDescription>isAbstract()));
                        //排除不想被拦截的servlet
                        List<String> excludeClassPrefixList = ConfigUtils.me().getList("plugins.servlet.excludeClassPrefix");
                        if (excludeClassPrefixList != null && !excludeClassPrefixList.isEmpty()) {
                            for (String excludeClassPrefix : excludeClassPrefixList) {
                                matcher = matcher.and(ElementMatchers.not(ElementMatchers.<TypeDescription>nameStartsWith(excludeClassPrefix)));
                            }
                        }
                        return matcher;
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        // 匹配Servlet的do*方法
                        ElementMatcher.Junction<MethodDescription> servletMatcher = ElementMatchers.isMethod()
                                .and(ElementMatchers.takesArguments(2))
                                .and(ElementMatchers.takesArgument(0, ElementMatchers.named("javax.servlet.http.HttpServletRequest")))
                                .and(ElementMatchers.takesArgument(1, ElementMatchers.named("javax.servlet.http.HttpServletResponse")))
                                .and(ElementMatchers.<MethodDescription>nameStartsWith("do"));
                        
                        return servletMatcher;
                    }
                }
        };
    }


    @Override
    public Class interceptorAdviceClass() {
        return ServletAdvice.class;
    }
}
