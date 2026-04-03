package org.xi.lt.agent.diagnostic.remoting.netty;

import com.google.common.collect.ImmutableList;
import org.xi.lt.agent.diagnostic.agent.common.ResponseHandler;
import org.xi.lt.agent.diagnostic.agent.common.job.ResponseJobStore;
import org.xi.lt.agent.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.agent.diagnostic.remoting.protocol.RemotingHeader;

import java.util.List;

/**
 * @author zhenyu.nie created on 2019 2019/10/31 14:49
 */
public class JobPauseProcessor implements Processor<String> {

    private final ResponseJobStore jobStore;

    public JobPauseProcessor(ResponseJobStore jobStore) {
        this.jobStore = jobStore;
    }

    @Override
    public List<Integer> types() {
        return ImmutableList.of(CommandCode.REQ_TYPE_JOB_PAUSE.getCode());
    }

    @Override
    public void process(RemotingHeader header, String command, ResponseHandler handler) {
        jobStore.pause(command);
    }
}
