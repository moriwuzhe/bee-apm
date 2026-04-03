package com.taobao.arthas.core.shell.system.impl;

import com.taobao.arthas.core.advisor.AdviceListener;
import com.taobao.arthas.core.advisor.AdviceWeaver;
import com.taobao.arthas.core.command.model.ResultModel;
import com.taobao.arthas.core.shell.cli.CliToken;
import com.taobao.arthas.core.shell.command.Command;
import com.taobao.arthas.core.shell.command.CommandProcess;
import com.taobao.arthas.core.shell.command.internal.CloseFunction;
import com.taobao.arthas.core.shell.command.internal.StatisticsFunction;
import com.taobao.arthas.core.shell.handlers.Handler;
import com.taobao.arthas.core.shell.session.Session;
import com.taobao.arthas.core.shell.system.ExecStatus;
import com.taobao.arthas.core.shell.system.Job;
import com.taobao.arthas.core.shell.term.Term;
import com.taobao.arthas.core.shell.term.Tty;
import com.taobao.arthas.core.util.LogUtil;
import com.taobao.arthas.core.util.usage.StyledUsageFormatter;
import com.taobao.middleware.cli.CLIException;
import com.taobao.middleware.cli.CommandLine;
import com.taobao.middleware.cli.UsageMessageFormatter;
import com.alibaba.arthas.deps.org.slf4j.Logger;
import com.taobao.text.ui.Ansi;
import io.termd.core.function.Function;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author zhenyu.nie created on 2018 2018/11/21 16:15
 * 因为类可见性的问题，从arthas copy出来
 */
public class QProcessImpl implements CommandProcess, Tty {

    private static final Logger logger = LogUtil.getResultLogger();

    private final Command command;
    private final List<CliToken> args;
    private final Term term;
    private final CommandLine commandLine;
    private Handler<String> stdinHandler;
    private Handler<Void> resumeHandler;
    private Handler<Void> suspendHandler;
    private Handler<Void> interruptHandler;
    private Handler<Void> backgroundHandler;
    private Handler<Void> foregroundHandler;
    private Handler<Void> endHandler;
    private Handler<Void> resizeHandler;
    private boolean foreground = true;
    private int status;
    private ExecStatus processStatus;
    private JobImpl job;
    private int jobid;
    private Handler<CommandProcess> handler;
    private AdviceListener suspendedListener = null;
    private int enhanceLock = -1;
    private String cacheLocation;

    public QProcessImpl(Command command, List<CliToken> args, QJobControllerImpl qJobControllerImpl, Term term, int jobid) {
        this.command = command;
        this.args = args;
        this.term = term;
        this.jobid = jobid;
        this.commandLine = qJobControllerImpl.createCommandLine(command, args);
    }

    @Override
    public int getJobId() {
        return jobid;
    }

    @Override
    public void setJobId(int jobid) {
        this.jobid = jobid;
    }

    @Override
    public Command command() {
        return command;
    }

    @Override
    public CommandLine commandLine() {
        return commandLine;
    }

    @Override
    public List<CliToken> argsTokens() {
        return args;
    }

    @Override
    public List<String> args() {
        List<String> result = new LinkedList<String>();
        for (CliToken token : argsTokens()) {
            result.add(token.value());
        }
        return result;
    }

    @Override
    public String name() {
        return command.name();
    }

    @Override
    public String formattedUsage() {
        StringBuilder usage = new StringBuilder();
        String[] examples = command.getExamples();
        StyledUsageFormatter formatter = new StyledUsageFormatter(Ansi.undertone(), Ansi.reset());
        formatter.addUsage(command, usage);
        if (examples.length > 0) {
            usage.append("\n");
            usage.append("Examples:\n");
            for (String example : examples) {
                usage.append("  ").append(Ansi.undertone()).append(example).append(Ansi.reset()).append("\n");
            }
        }
        return usage.toString();
    }

    @Override
    public void run() {
        try {
            handler.handle(this);
        } catch (Throwable t) {
            logger.error("Error during processing the command:", t);
            write("Error during processing the command: " + t.getMessage() + "\n");
            terminate(1, null);
        }
    }

    @Override
    public void setJob(JobImpl job) {
        this.job = job;
    }

    @Override
    public Tty getTty() {
        return (Tty) this;
    }

    @Override
    public Term term() {
        return term;
    }

    @Override
    public Session session() {
        return job.session();
    }

    @Override
    public void setProcessEventHandler(Handler<CommandProcess> handler) {
        this.handler = handler;
    }

    @Override
    public CommandProcess write(String data) {
        term.write(data);
        return this;
    }

    @Override
    public CommandProcess write(byte[] bytes) {
        term.write(bytes);
        return this;
    }

    @Override
    public boolean isRunning() {
        return processStatus == ExecStatus.RUNNING;
    }

    @Override
    public void resume() {
        if (resumeHandler != null) {
            resumeHandler.handle(null);
        }
    }

    @Override
    public void suspend() {
        if (suspendHandler != null) {
            suspendHandler.handle(null);
        }
    }

    @Override
    public void interrupt() {
        if (interruptHandler != null) {
            interruptHandler.handle(null);
        }
    }

    @Override
    public void terminate() {
        terminate(0, null);
    }

    @Override
    public void terminate(int statusCode) {
        terminate(statusCode, null);
    }

    @Override
    public void terminate(int statusCode, Handler<Void> onDone) {
        this.status = statusCode;
        this.processStatus = ExecStatus.TERMINATED;
        if (endHandler != null) {
            endHandler.handle(null);
        }
        if (this.job != null && this.job.controller() != null) {
            this.job.controller().removeJob(this.job.id());
        }
        if (onDone != null) {
            onDone.handle(null);
        }
    }

    @Override
    public int exitCode() {
        return status;
    }

    @Override
    public ExecStatus getStatus() {
        return processStatus;
    }

    @Override
    public Job getJob() {
        return job;
    }

    @Override
    public CommandProcess interruptHandler(Handler<Void> handler) {
        this.interruptHandler = handler;
        return this;
    }

    @Override
    public CommandProcess suspendHandler(Handler<Void> handler) {
        this.suspendHandler = handler;
        return this;
    }

    @Override
    public CommandProcess resumeHandler(Handler<Void> handler) {
        this.resumeHandler = handler;
        return this;
    }

    @Override
    public CommandProcess endHandler(Handler<Void> handler) {
        this.endHandler = handler;
        return this;
    }

    @Override
    public CommandProcess resizehandler(Handler<Void> handler) {
        this.resizeHandler = handler;
        return this;
    }

    @Override
    public CommandProcess backgroundHandler(Handler<Void> handler) {
        synchronized (QProcessImpl.this) {
            backgroundHandler = handler;
        }
        return this;
    }

    @Override
    public CommandProcess foregroundHandler(Handler<Void> handler) {
        synchronized (QProcessImpl.this) {
            foregroundHandler = handler;
        }
        return this;
    }

    @Override
    public void register(AdviceListener adviceListener, java.lang.instrument.ClassFileTransformer classFileTransformer) {
        AdviceWeaver.reg(adviceListener);
    }

    @Override
    public void unregister() {
        // AdviceWeaver.unReg doesn't need parameter in new version
    }

    @Override
    public AtomicInteger times() {
        return new AtomicInteger();
    }

    @Override
    public void resume() {
        if (this.enhanceLock >= 0 && suspendedListener != null) {
            AdviceWeaver.resume(suspendedListener);
            suspendedListener = null;
        }
    }

    @Override
    public void suspend() {
        if (this.enhanceLock >= 0) {
            // AdviceWeaver.suspend now only takes AdviceListener
        }
    }

    @Override
    public void echoTips(String s) {
        // required by interface, empty implementation
    }

    @Override
    public String cacheLocation() {
        return cacheLocation;
    }

    @Override
    public void end() {
        end(0);
    }

    @Override
    public void end(int statusCode) {
        terminate(statusCode, null);
    }

    @Override
    public void end(int statusCode, String message) {
        if (message != null && !message.isEmpty()) {
            write(message);
        }
        terminate(statusCode, null);
    }

    @Override
    public boolean isForeground() {
        return foreground;
    }

    @Override
    public CommandProcess stdinHandler(Handler<String> handler) {
        this.stdinHandler = handler;
        return this;
    }

    @Override
    public void appendResult(ResultModel resultModel) {
        // required by new API, just implement empty
    }

    // Tty interface methods
    @Override
    public int width() {
        if (term != null) {
            return term.width();
        }
        return 0;
    }

    @Override
    public int height() {
        if (term != null) {
            return term.height();
        }
        return 0;
    }

    @Override
    public void close() {
        // Tty interface, do nothing
    }

    @Override
    public int type() {
        return 0;
    }

    static class ProcessOutput {

        private List<Function<String, String>> stdoutHandlerChain;
        private StatisticsFunction statisticsHandler = null;
        private List<Function<String, String>> flushHandlerChain = null;
        private String cacheLocation;
        private Tty term;

        public ProcessOutput(List<Function<String, String>> stdoutHandlerChain, String cacheLocation, Tty term) {
            int i = 0;
            for (; i < stdoutHandlerChain.size(); i++) {
                if (stdoutHandlerChain.get(i) instanceof StatisticsFunction) {
                    break;
                }
            }
            if (i < stdoutHandlerChain.size()) {
                this.stdoutHandlerChain = stdoutHandlerChain.subList(0, i + 1);
                this.statisticsHandler = (StatisticsFunction) stdoutHandlerChain.get(i);
                if (i < stdoutHandlerChain.size() - 1) {
                    flushHandlerChain = stdoutHandlerChain.subList(i + 1, stdoutHandlerChain.size());
                }
            } else {
                this.stdoutHandlerChain = stdoutHandlerChain;
            }

            this.cacheLocation = cacheLocation;
            this.term = term;
        }

        public void write(String data) {
            if (stdoutHandlerChain != null) {
                for (Function<String, String> function : stdoutHandlerChain) {
                    data = function.apply(data);
                }
            }
        }

        public void close() {
            if (statisticsHandler != null && flushHandlerChain != null) {
                String data = statisticsHandler.result();

                for (Function<String, String> function : flushHandlerChain) {
                    data = function.apply(data);
                    if (function instanceof StatisticsFunction) {
                        data = ((StatisticsFunction) function).result();
                    }

                }
            }

            if (stdoutHandlerChain != null) {
                for (Function<String, String> function : stdoutHandlerChain) {
                    if (function instanceof CloseFunction) {
                        ((CloseFunction) function).close();
                    }
                }
            }
        }
    }
}
