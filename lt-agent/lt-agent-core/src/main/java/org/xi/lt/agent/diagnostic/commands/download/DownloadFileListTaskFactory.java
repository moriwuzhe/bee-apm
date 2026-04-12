package org.xi.lt.agent.diagnostic.commands.download;

import com.google.common.collect.ImmutableSet;
import org.xi.lt.agent.diagnostic.agent.common.ResponseHandler;
import org.xi.lt.agent.diagnostic.remoting.netty.Task;
import org.xi.lt.agent.diagnostic.remoting.netty.TaskFactory;
import org.xi.lt.agent.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.agent.diagnostic.remoting.protocol.RemotingHeader;

import java.util.Set;

/**
 * @author leix.xie
 * @date 2019/11/4 16:23
 * @describe
 */
public class DownloadFileListTaskFactory implements TaskFactory<String> {
    @Override
    public Set<Integer> codes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_LIST_DOWNLOAD_FILE.getCode());
    }

    @Override
    public String name() {
        return "list download file";
    }

    @Override
    public Task create(RemotingHeader header, String command, ResponseHandler handler) {
        return new DownloadFileListTask(header.getId(), command, handler, header.getMaxRunningMs());
    }
}
