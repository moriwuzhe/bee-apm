package org.xi.lt.agent.boot;

import org.xi.lt.agent.common.*;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogUtil;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.FieldDefine;
import org.xi.lt.agent.plugin.AbstractPlugin;
import org.xi.lt.agent.plugin.InterceptPoint;
import org.xi.lt.agent.plugin.PluginLoader;
import org.xi.lt.agent.plugin.handler.HandlerLoader;
import org.xi.lt.agent.reporter.ReporterFactory;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.asm.Advice;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.DynamicType;
import net.bytebuddy.matcher.ElementMatchers;
import net.bytebuddy.utility.JavaModule;

import java.io.File;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import java.util.List;
import java.util.jar.JarFile;

/**
 * @author yuan
 * @date 2018-08-06
 */
public class LtAgent {
    private static volatile DiagAgentClient diagClient;
    private static volatile Instrumentation instrumentation;

    public static void premain(String arguments, Instrumentation inst) throws Throwable {
        instrumentation = inst;
        loadSpy(inst);
        LogUtil.write("\n---------------------------------Welcome LT监控系统 ---------------------------------------");
        initialize();
        List<AbstractPlugin> plugins = PluginLoader.loadPlugins();

        String rootPath = LtUtils.getJarDirPath();
        File spyJar = new File(rootPath + "/lt-agent-spy.jar");
        AgentBuilder agentBuilder = new AgentBuilder.Default()
                .with(AgentBuilder.RedefinitionStrategy.RETRANSFORMATION)
                .with(AgentBuilder.LocationStrategy.ForClassLoader.STRONG.withFallbackTo(
                        net.bytebuddy.dynamic.ClassFileLocator.ForJarFile.of(spyJar)
                ))
                .with(buildListener())
                .disableClassFormatChanges()
                .ignore(ElementMatchers.<TypeDescription>none().and(ElementMatchers.nameStartsWith("org.xi.lt.agent.")));
        for (int i = 0; i < plugins.size(); i++) {
            final AbstractPlugin plugin = plugins.get(i);
            InterceptPoint[] interceptPoints = plugin.buildInterceptPoint();
            for (int j = 0; j < interceptPoints.length; j++) {
                final InterceptPoint interceptPoint = interceptPoints[j];
                AgentBuilder.Transformer transformer = new AgentBuilder.Transformer() {
                    private final ILog log = LogFactory.getLog("Transform");

                    @Override
                    public DynamicType.Builder<?> transform(DynamicType.Builder<?> builder,
                                                            TypeDescription typeDescription,
                                                            ClassLoader classLoader, JavaModule javaModule, ProtectionDomain protectionDomain) {
                        String className = typeDescription.getName();
                        log.exec("class-name={}, plugin-name={}", className, plugin.getName());
                        builder = builder.visit(Advice.to(plugin.interceptorAdviceClass()).on(interceptPoint.buildMethodsMatcher()));
                        FieldDefine[] fields = plugin.buildFieldDefine();
                        if (fields != null && fields.length > 0) {
                            for (int x = 0; x < fields.length; x++) {
                                builder = builder.defineField(fields[x].name, fields[x].type, fields[x].modifiers);
                            }
                        }
                        return builder;
                    }
                };
                agentBuilder = agentBuilder.type(interceptPoint.buildTypesMatcher()).transform(transformer);
            }
        }
        agentBuilder.installOn(inst);
    }

    public static Instrumentation getInstrumentation() {
        return instrumentation;
    }

    public static void loadSpy(Instrumentation inst) {
        try {
            String rootPath = LtUtils.getJarDirPath();
            inst.appendToBootstrapClassLoaderSearch(new JarFile(new File(rootPath + "/lt-agent-spy.jar")));
            LogUtil.init(rootPath);
            HandlerLoader.init(rootPath);
            LogUtil.log("load lt-agent-spy.jar successful!");
        } catch (Throwable t) {
            //初始化失败LogUtil可能无法使用，这里使用LtUtils.write来写日志
            LtUtils.write("load lt-agent-spy.jar failed!", t, "lt.log");
            throw new RuntimeException("load lt-agent-spy.jar failed!", t);
        }
    }


    private static AgentBuilder.Listener buildListener() {
        return new AgentBuilder.Listener() {
            private final ILog log = LogFactory.getLog("TransformListener");

            @Override
            public void onDiscovery(String s, ClassLoader classLoader, JavaModule javaModule, boolean b) {

            }

            @Override
            public void onTransformation(TypeDescription typeDescription, ClassLoader classLoader, JavaModule javaModule, boolean b, DynamicType dynamicType) {
                WeavingClassLog.INSTANCE.log(typeDescription, dynamicType);
            }

            @Override
            public void onIgnored(TypeDescription typeDescription, ClassLoader classLoader, JavaModule javaModule, boolean b) {
            }

            @Override
            public void onError(String s, ClassLoader classLoader, JavaModule javaModule, boolean b, Throwable throwable) {
                log.error("", throwable);
            }

            @Override
            public void onComplete(String s, ClassLoader classLoader, JavaModule javaModule, boolean b) {

            }
        };
    }

    private static void initialize() {
        try {
            LogUtil.log("start......");
            BootPluginFactory.init();
            IdHelper.init();
            ReporterFactory.init();
            HeartbeatTask.start();
            JvmInfoTask.start();
            diagClient = DiagAgentClient.tryCreate();
            if (diagClient != null) {
                diagClient.start();
            }

            LogUtil.setEmptyHandlerLog(LogFactory.getLog("EmptyHandler"));
            Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
                @Override
                public void run() {
                    HeartbeatTask.shutdown();
                    JvmInfoTask.shutdown();
                    ReporterFactory.shutdown();
                    IdHelper.shutdown();
                    if (diagClient != null) {
                        diagClient.stop();
                    }
                    LogUtil.log("shutdown all lt tasks");
                }
            }));
        } catch (Throwable e) {
            LogUtil.log("lt agent initialization failed!", e);
            throw new RuntimeException("lt agent initialization failed", e);
        }
    }
}
