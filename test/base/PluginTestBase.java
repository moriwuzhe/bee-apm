package base;

import net.bytebuddy.agent.ByteBuddyAgent;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.ClassFileLocator;
import net.bytebuddy.dynamic.loading.ClassInjector;
import net.bytebuddy.matcher.ElementMatchers;
import org.junit.jupiter.api.BeforeAll;
import org.xi.lt.agent.plugin.AbstractPlugin;

import java.lang.instrument.Instrumentation;
import java.util.Collections;
import java.util.Map;

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
        // 替换默认上报器为测试上报器
        try {
            Class<?> reporterFactoryClass = Class.forName("org.xi.lt.agent.reporter.ReporterFactory");
            java.lang.reflect.Field reporterField = reporterFactoryClass.getDeclaredField("reporter");
            reporterField.setAccessible(true);
            reporterField.set(null, testSpanReporter);
        } catch (Exception e) {
            throw new RuntimeException("Failed to init test reporter", e);
        }
    }

    /**
     * 安装插件到当前类加载器
     * @param plugin 要测试的插件实例
     */
    protected void installPlugin(AbstractPlugin plugin) throws Exception {
        new AgentBuilder.Default()
                .ignore(ElementMatchers.nameStartsWith("net.bytebuddy."))
                .or(ElementMatchers.nameStartsWith("org.junit."))
                .or(ElementMatchers.nameStartsWith("base."))
                .type(plugin.buildInterceptPoint()[0].buildTypesMatcher())
                .transform((builder, typeDescription, classLoader, module, protectionDomain) -> {
                    for (AbstractPlugin.InterceptPoint point : plugin.buildInterceptPoint()) {
                        builder = builder.visit(plugin.interceptorAdviceClass()
                                        .getDeclaredConstructor().newInstance()
                                        .getAdvice()
                                        .on(point.buildMethodsMatcher()));
                    }
                    return builder;
                })
                .installOn(instrumentation);
    }

    /**
     * 加载并定义被拦截的类
     * @param className 类名
     * @param classFile 类文件字节码
     * @return 定义后的类
     */
    protected Class<?> defineClass(String className, byte[] classFile) throws Exception {
        ClassInjector.UsingUnsafe.of(classLoader)
                .inject(Collections.singletonMap(new TypeDescription.ForLoadedClass(Class.forName(className)), classFile));
        return Class.forName(className);
    }

    /**
     * 获取类的字节码
     * @param clazz 类
     * @return 字节码数组
     */
    protected byte[] getClassBytes(Class<?> clazz) throws Exception {
        return ClassFileLocator.ForClassLoader.of(clazz.getClassLoader())
                .locate(clazz.getName())
                .resolve();
    }

    /**
     * 清除上报的Span数据
     */
    protected void clearSpans() {
        testSpanReporter.clear();
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
