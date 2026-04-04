package base;

import net.bytebuddy.agent.ByteBuddyAgent;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.asm.Advice;
import net.bytebuddy.matcher.ElementMatchers;
import org.junit.jupiter.api.BeforeAll;
import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.reporter.ReporterFactory;
import org.xi.lt.agent.model.Span;

import java.lang.instrument.Instrumentation;
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * 插件测试基类
 * 提供字节码拦截、类加载、Span采集等通用测试能力
 * @author LT Monitor Dev
 */
public abstract class PluginTestBase {
    protected static Instrumentation instrumentation;
    protected static TestSpanReporter testSpanReporter;

    @BeforeAll
    public static void initByteBuddyAgent() {
        // 安装ByteBuddy Agent
        instrumentation = ByteBuddyAgent.install();
        
        // 初始化测试Span上报器
        testSpanReporter = new TestSpanReporter();
        LogUtil.init(null);
        try {
            java.lang.reflect.Field reporterField = ReporterFactory.class.getDeclaredField("reporter");
            reporterField.setAccessible(true);
            reporterField.set(null, testSpanReporter);

            java.lang.reflect.Field reporterMapField = ReporterFactory.class.getDeclaredField("reporterMap");
            reporterMapField.setAccessible(true);
            reporterMapField.set(null, new HashMap<String, Object>());

            java.lang.reflect.Field queueField = ReporterFactory.class.getDeclaredField("queue");
            queueField.setAccessible(true);
            queueField.set(null, new LinkedBlockingQueue<Span>(10000));

            java.lang.reflect.Field idleSleepField = ReporterFactory.class.getDeclaredField("idleSleep");
            idleSleepField.setAccessible(true);
            idleSleepField.setInt(null, 0);

            java.lang.reflect.Field batchSizeField = ReporterFactory.class.getDeclaredField("batchSize");
            batchSizeField.setAccessible(true);
            batchSizeField.setInt(null, 1000);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 安装插件到当前类加载器
     * @param plugin 要测试的插件实例
     */
    protected void installPlugin(AbstractPlugin plugin) throws Exception {
        new AgentBuilder.Default()
                .with(AgentBuilder.RedefinitionStrategy.RETRANSFORMATION)
                .ignore(
                        ElementMatchers.nameStartsWith("net.bytebuddy.")
                                .or(ElementMatchers.nameStartsWith("org.junit."))
                                .or(ElementMatchers.nameStartsWith("base."))
                )
                .type(plugin.buildInterceptPoint()[0].buildTypesMatcher())
                .transform((builder, typeDescription, classLoader, module, protectionDomain) -> {
                    for (InterceptPoint point : plugin.buildInterceptPoint()) {
                        builder = builder.visit(Advice.to(plugin.interceptorAdviceClass()).on(point.buildMethodsMatcher()));
                    }
                    return builder;
                })
                .installOn(instrumentation);
    }

    /**
     * 清除上报的Span数据
     */
    protected void clearSpans() {
        try {
            java.lang.reflect.Field queueField = ReporterFactory.class.getDeclaredField("queue");
            queueField.setAccessible(true);
            Object queue = queueField.get(null);
            if (queue instanceof java.util.concurrent.BlockingQueue) {
                ((java.util.concurrent.BlockingQueue<?>) queue).clear();
            }
        } catch (Exception ignored) {
        }
        testSpanReporter.clear();
    }

    protected List<Span> getSpans() {
        flushReportedSpans();
        return testSpanReporter.getSpans();
    }

    protected List<Span> getSpansByType(String type) {
        flushReportedSpans();
        return testSpanReporter.getSpansByType(type);
    }

    protected void flushReportedSpans() {
        ReporterFactory.doReport();
        ReporterFactory.doReport();
    }

    /**
     * 获取上报的Span数量
     * @return Span数量
     */
    protected int getReportedSpanCount() {
        return testSpanReporter.getSpans().size();
    }

    /**
     * 获取测试类加载器
     */
    protected ClassLoader getClassLoader() {
        return Thread.currentThread().getContextClassLoader();
    }
}
