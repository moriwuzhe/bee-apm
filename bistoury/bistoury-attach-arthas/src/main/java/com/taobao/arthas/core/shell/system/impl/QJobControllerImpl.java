package com.taobao.arthas.core.shell.system.impl;

import com.taobao.arthas.core.GlobalOptions;
import com.taobao.arthas.core.shell.cli.CliToken;
import com.taobao.arthas.core.shell.command.Command;
import com.taobao.arthas.core.shell.command.CommandProcess;
import com.taobao.arthas.core.shell.command.internal.RedirectHandler;
import com.taobao.arthas.core.shell.command.internal.StdoutHandler;
import com.taobao.arthas.core.shell.command.internal.TermHandler;
import com.taobao.arthas.core.shell.impl.ShellImpl;
import com.taobao.arthas.core.shell.session.Session;
import com.taobao.arthas.core.shell.system.Job;
import com.taobao.arthas.core.shell.term.Term;
import com.alibaba.arthas.deps.org.slf4j.Logger;
import com.taobao.arthas.core.util.LogUtil;
import com.taobao.arthas.core.util.TokenUtils;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author zhenyu.nie created on 2018 2018/11/21 16:13
 * 因为类可见性的问题，从arthas copy出来
 */
public class QJobControllerImpl extends JobControllerImpl {

    private static final Logger logger = LogUtil.getResultLogger();

    private final SortedMap<Integer, JobImpl> jobs = new TreeMap<Integer, JobImpl>();
    private final AtomicInteger idGenerator = new AtomicInteger(0);
    private boolean closed = false;

    public synchronized Set<Job> jobs() {
        return new HashSet<Job>(jobs.values());
    }

    public synchronized Job getJob(int id) {
        return jobs.get(id);
    }

    synchronized boolean removeJob(int id) {
        return jobs.remove(id) != null;
    }

    @Override
    public Job createJob(InternalCommandManager commandManager, List<CliToken> tokens, ShellImpl shell) {
        int jobId = idGenerator.incrementAndGet();
        StringBuilder line = new StringBuilder();
        for (CliToken arg : tokens) {
            line.append(arg.raw());
        }
        boolean runInBackground = false;
        if (!tokens.isEmpty()) {
            CliToken last = tokens.get(tokens.size() - 1);
            runInBackground = last.isBackground();
        }
        Term term = shell.term();
        QProcessImpl process = new QProcessImpl(commandManager.getCommand(
                TokenUtils.firstToken(tokens)), tokens, this, term, jobId);
        process.setJobId(jobId);
        JobImpl job = new JobImpl(jobId, this, process, line.toString(), runInBackground, shell.session(), null);
        jobs.put(jobId, job);
        for (Handler<CommandProcess> termHandler : TermHandler.getHandlers()) {
            termHandler.handle(process);
        }
        for (Handler<CommandProcess> stdHandler : StdoutHandler.getHandlers()) {
            stdHandler.handle(process);
        }
        for (RedirectHandler redirect : RedirectHandler.create(tokens)) {
            redirect.handle(process);
        }
        return job;
    }

    @Override
    public synchronized void close() {
        if (closed) {
            return;
        }
        closed = true;
        // close jobs in reverse order
        List<JobImpl> copy = new ArrayList<JobImpl>(jobs.values());
        Collections.reverse(copy);
        for (Job job : copy) {
            job.terminate();
        }
        clearCache();
        super.close();
    }

    private void clearCache() {
        // clear the command output cache when job exit.
        File cacheDir = new File(".arthas/cache");
        if (!cacheDir.exists()) {
            return;
        }
        File[] files = cacheDir.listFiles();
        if (files != null) {
            for (File file : files) {
                //delete when file last modified > timeout
                if (file.lastModified() + GlobalOptions.commandTimeout() * 1000 < new Date().getTime()) {
                    try {
                        deleteDirectory(file);
                    } catch (IOException e) {
                        logger.error("delete cache directory: {} failed.", file.getAbsolutePath(), e);
                    }
                }
            }
        }
    }

    private static void deleteDirectory(File directory) throws IOException {
        if (directory.exists()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    deleteDirectory(file);
                }
            }
            directory.delete();
        }
    }

}
