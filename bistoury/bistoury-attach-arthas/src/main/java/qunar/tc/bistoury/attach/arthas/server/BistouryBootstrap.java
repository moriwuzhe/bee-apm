/*
 * Copyright (C) 2019 Qunar, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

package qunar.tc.bistoury.attach.arthas.server;

import com.taobao.arthas.core.config.Configure;
import com.taobao.arthas.core.shell.ShellServer;
import com.taobao.arthas.core.shell.ShellServerOptions;
import com.taobao.arthas.core.shell.command.Command;
import com.taobao.arthas.core.shell.command.CommandResolver;
import com.taobao.arthas.core.shell.handlers.Handler;
import com.taobao.arthas.core.shell.term.impl.TelnetTermServer;
import com.taobao.arthas.core.util.LogUtil;
import com.taobao.arthas.core.util.UserStatUtil;
import com.alibaba.arthas.deps.org.slf4j.Logger;
import qunar.tc.bistoury.attach.arthas.instrument.InstrumentClientStore;
import qunar.tc.bistoury.common.BistouryConstants;

import java.lang.instrument.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * @author zhenyu.nie created on 2018 2018/11/19 19:49
 */
public class BistouryBootstrap {

    private static Logger logger = LogUtil.getResultLogger();
    private static BistouryBootstrap bistouryBootstrap;

    private AtomicBoolean isBindRef = new AtomicBoolean(false);
    private int pid;
    private Instrumentation instrumentation;
    private Thread shutdown;
    private ShellServer shellServer;
    private ExecutorService executorService;

    private BistouryBootstrap(int pid, Instrumentation instrumentation) {
        this.pid = pid;
        this.instrumentation = instrumentation;
    }

    public static BistouryBootstrap init(int pid, Configure configure, Instrumentation inst) {
        if (bistouryBootstrap == null) {
            synchronized (BistouryBootstrap.class) {
                if (bistouryBootstrap == null) {
                    bistouryBootstrap = new BistouryBootstrap(pid, inst);
                    bistouryBootstrap.start(configure);
                }
            }
        }
        return bistouryBootstrap;
    }

    private void start(Configure configure) {
        long start = System.currentTimeMillis();
        logger.info("bistoury is starting...");
        ShellServerOptions options = new ShellServerOptions();
        if (configure.getSessionTimeout() != null) {
            options.setConnectionTimeout(configure.getSessionTimeout());
        }
        options.setInstrumentation(instrumentation);

        QBuiltinCommandPack qBuiltinCommandPack = new QBuiltinCommandPack();
        List<Command> commands = qBuiltinCommandPack.commands();

        ShellServer shellServer = options.create();
        Runtime.getRuntime().addShutdownHook(new Thread() {
            @Override
            public void run() {
                destroy();
            }
        });

        this.shellServer = shellServer;
        this.executorService = Executors.newCachedThreadPool(new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setName("bistoury-bootstrap");
                return thread;
            }
        });

        try {
            new TelnetTermServer(configure.getIp(), configure.getTelnetPort(), configure.getSessionTimeout())
                    .listen(shellServer).accept(new Handler<Void>() {
                @Override
                public void handle(Void aVoid) {
                    isBindRef.set(true);
                    logger.info("bistoury-server listening on network={};telnet={};timeout={};", configure.getIp(),
                            configure.getTelnetPort(), configure.getSessionTimeout());

                    logger.info("bistoury-server started in {} ms", System.currentTimeMillis() - start);
                }
            });

            for (Command command : commands) {
                shellServer.registerCommand(command);
            }

            logger.info("bistoury-server listening on network={};telnet={};timeout={}", (Object) configure.getIp(),
                    configure.getTelnetPort(), configure.getSessionTimeout());

            logger.info("bistoury-server started in {} ms", System.currentTimeMillis() - start);
        } catch (Throwable e) {
            logger.error("Error during bind to port " + configure.getTelnetPort(), e);
            if (shellServer != null) {
                shellServer.close();
            }

            InstrumentClientStore.destroy();

            throw new RuntimeException("bistoury server startup failed!", e);
        }

        shutdown = new Thread("bistoury-shutdown") {
            public void run() {
                destroy();
            }
        };

        Runtime.getRuntime().addShutdownHook(shutdown);
    }

    public boolean isBind() {
        return isBindRef.get();
    }

    public void destroy() {
        executorService.shutdownNow();
        UserStatUtil.destroy();
        // clear the reference in Spy class.
        cleanUpSpyReference();
        try {
            Runtime.getRuntime().removeShutdownHook(shutdown);
        } catch (Throwable t) {
            // ignore
        }
        logger.info("bistoury-server destroy completed.");
        // see middleware-container/arthas/issues/123
        // Newer arthas removed closeResultLogger()
        /*
        try {
            LogUtil.closeResultLogger();
        } catch (Throwable e) {
            logger.error("qlogger-001", "close logger error", e);
        }
        */

        try {
            // 如果日志实现是log4j的话
            closeResultLog4jLogger();
        } catch (Throwable e) {
            // ignore
        }
    }

    public int getPid() {
        return pid;
    }

    public Instrumentation getInstrumentation() {
        return instrumentation;
    }

    /**
     * 清除spy中对classloader的引用，避免内存泄露
     */
    private void cleanUpSpyReference() {
        try {
            spyDestroy("java.arthas.Spy");
        } catch (ClassNotFoundException e) {
            logger.error("arthas spy load failed from BistouryClassLoader, which should not happen", e);
        } catch (Exception e) {
            logger.error("arthas spy destroy failed: ", e);
        }

        try {
            spyDestroy(BistouryConstants.SPY_CLASSNAME);
        } catch (ClassNotFoundException e) {
            logger.error("bistoury spy load failed from BistouryClassLoader, which should not happen", e);
        } catch (Exception e) {
            logger.error("bistoury spy destroy failed: ", e);
        }
    }

    private void spyDestroy(String spyClassname) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Class<?> spyClass = this.getClass().getClassLoader().loadClass(spyClassname);
        Method agentDestroyMethod = spyClass.getMethod("destroy");
        agentDestroyMethod.invoke(null);
    }

    /**
     * @return BistouryServer单例
     */
    public static BistouryBootstrap getInstance() {
        if (bistouryBootstrap == null) {
            throw new IllegalStateException("BistouryBootstrap must be initialized before!");
        }
        return bistouryBootstrap;
    }

    public void execute(Runnable command) {
        executorService.execute(command);
    }

    /*
     * 关闭log4j Logger
     */
    private void closeResultLog4jLogger() throws ClassNotFoundException, IllegalAccessException,
            NoSuchFieldException, InvocationTargetException, NoSuchMethodException {
        Class<?> loggerClass = Class.forName("org.apache.log4j.Logger");
        Class<?> logManagerClass = Class.forName("org.apache.log4j.LogManager");
        Method getCurrentLoggers = logManagerClass.getMethod("getCurrentLoggers");
        @SuppressWarnings("unchecked")
        List<org.apache.log4j.Logger> loggers = (List<org.apache.log4j.Logger>) getCurrentLoggers.invoke(logManagerClass);
        org.apache.log4j.Logger root = org.apache.log4j.LogManager.getRootLogger();
        if (root != null) {
            loggers.add(root);
        }
        for (org.apache.log4j.Logger logger : loggers) {
            logger.removeAllAppenders();
        }
    }

}
