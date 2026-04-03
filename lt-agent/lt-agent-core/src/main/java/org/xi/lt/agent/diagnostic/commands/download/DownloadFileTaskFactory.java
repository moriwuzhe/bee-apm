package org.xi.lt.agent.diagnostic.commands.download;

import com.google.common.collect.ImmutableSet;
import org.xi.lt.agent.diagnostic.agent.common.ResponseHandler;
import org.xi.lt.agent.diagnostic.remoting.command.DownloadCommand;
import org.xi.lt.agent.diagnostic.remoting.netty.Task;
import org.xi.lt.agent.diagnostic.remoting.netty.TaskFactory;
import org.xi.lt.agent.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.agent.diagnostic.remoting.protocol.RemotingHeader;

import java.util.Set;

/**
 * @author leix.xie
 * @date 2019/11/5 15:43
 * @describe
 */
public class DownloadFileTaskFactory implements TaskFactory<DownloadCommand> {
    @Override
    public Set<Integer> codes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_DOWNLOAD_FILE.getCode());
    }

    @Override
    public String name() {
        return "download file";
    }

    @Override
    public Task create(RemotingHeader header, DownloadCommand command, ResponseHandler handler) {
        return new DownloadFileTask(header.getId(), header.getMaxRunningMs(), command, handler);
    }
}
