package org.xi.lt.agent.plugin.elasticsearch;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.ElasticsearchAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Elasticsearch客户端埋点插件
 * 支持RestHighLevelClient 6.x/7.x版本和TransportClient 5.x/6.x/7.x版本
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "elasticsearch")
public class ElasticsearchPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "elasticsearch";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截RestHighLevelClient的请求方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("org.elasticsearch.client.RestHighLevelClient")
                                .or(named("org.elasticsearch.client.RestClient"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return nameStartsWith("performRequest")
                                .and(not(isStatic()))
                                .and(isPublic());
                    }
                },
                // 拦截TransportClient的执行方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return hasSuperType(named("org.elasticsearch.client.Client"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()))
                                .and(nameContains("TransportClient"));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return named("execute")
                                .and(not(isStatic()))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return ElasticsearchAdvice.class;
    }
}
