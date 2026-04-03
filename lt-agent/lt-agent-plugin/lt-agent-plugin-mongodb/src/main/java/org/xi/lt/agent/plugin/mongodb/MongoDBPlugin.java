package org.xi.lt.agent.plugin.mongodb;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.MongoDBAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * MongoDB客户端埋点插件
 * 支持MongoDB Java Driver 3.x/4.x版本
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "mongodb")
public class MongoDBPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "mongodb";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截MongoDB操作执行方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("com.mongodb.MongoCollectionImpl")
                                .or(named("com.mongodb.client.internal.MongoCollectionImpl"))
                                .or(named("com.mongodb.DBCollectionImpl"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return nameStartsWith("execute")
                                .and(not(isStatic()))
                                .and(isPublic());
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return MongoDBAdvice.class;
    }
}
