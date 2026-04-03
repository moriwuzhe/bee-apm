package org.xi.lt.agent.diagnostic.commands.profiler;

import com.google.common.collect.ImmutableSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xi.lt.agent.diagnostic.agent.common.ResponseHandler;
import org.xi.lt.agent.diagnostic.remoting.netty.Task;
import org.xi.lt.agent.diagnostic.remoting.netty.TaskFactory;
import org.xi.lt.agent.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.agent.diagnostic.remoting.protocol.RemotingHeader;

import java.util.Set;

/**
 * @author cai.wen created on 19-12-11 下午4:52
 */
public class ProfilerFileForProxyTaskFactory implements TaskFactory<String> {

    private static final Logger logger = LoggerFactory.getLogger(ProfilerFileForProxyTaskFactory.class);

    private static final String NAME = "profilerFile";

    @Override
    public Set<Integer> codes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_PROFILER_FILE.getCode());
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public Task create(RemotingHeader header, String command, ResponseHandler handler) {
        return new ProfilerFileForProxyTask(header.getId(), header.getMaxRunningMs(), handler, command);
    }
}
