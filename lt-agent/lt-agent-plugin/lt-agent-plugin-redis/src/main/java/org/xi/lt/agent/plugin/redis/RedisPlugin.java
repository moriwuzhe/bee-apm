package org.xi.lt.agent.plugin.redis;

import net.bytebuddy.description.method.MethodDescription;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.matcher.ElementMatcher;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.interceptor.RedisAdvice;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;

import static net.bytebuddy.matcher.ElementMatchers.*;

/**
 * Redis客户端埋点插件
 * 支持Jedis 3.x版本
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
@LtPlugin(type = LtPluginType.AGENT_PLUGIN, name = "redis")
public class RedisPlugin extends AbstractPlugin {

    @Override
    public String getName() {
        return "redis";
    }

    @Override
    public InterceptPoint[] buildInterceptPoint() {
        return new InterceptPoint[]{
                // 拦截Jedis类的所有命令方法
                new InterceptPoint() {
                    @Override
                    public ElementMatcher<TypeDescription> buildTypesMatcher() {
                        return named("redis.clients.jedis.Jedis")
                                .or(named("redis.clients.jedis.BinaryJedis"))
                                .and(not(isInterface()))
                                .and(not(isAbstract()));
                    }

                    @Override
                    public ElementMatcher<MethodDescription> buildMethodsMatcher() {
                        return isMethod()
                                .and(not(isConstructor()))
                                .and(not(isStatic()))
                                .and(isPublic())
                                .and(not(nameStartsWith("connect")))
                                .and(not(nameStartsWith("disconnect")))
                                .and(not(nameStartsWith("close")))
                                .and(not(nameStartsWith("ping")));
                    }
                }
        };
    }

    @Override
    public Class interceptorAdviceClass() {
        return RedisAdvice.class;
    }
}
