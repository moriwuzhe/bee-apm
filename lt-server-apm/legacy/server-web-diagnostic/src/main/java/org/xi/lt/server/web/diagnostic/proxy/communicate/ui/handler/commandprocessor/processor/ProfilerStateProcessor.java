package org.xi.lt.server.web.diagnostic.proxy.communicate.ui.handler.commandprocessor.processor;

import com.google.common.collect.ImmutableSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.xi.lt.server.web.diagnostic.common.BistouryConstants;
import org.xi.lt.server.web.diagnostic.common.TypeResponse;
import org.xi.lt.server.web.diagnostic.proxy.communicate.ui.handler.commandprocessor.AbstractCommand;
import org.xi.lt.server.web.diagnostic.proxy.service.profiler.ProfilerManager;
import org.xi.lt.server.web.diagnostic.proxy.util.ProfilerDatagramHelper;
import org.xi.lt.server.web.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.server.web.diagnostic.remoting.protocol.Datagram;
import org.xi.lt.server.web.diagnostic.remoting.protocol.RequestData;

import javax.annotation.Resource;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.xi.lt.server.web.diagnostic.common.BistouryConstants.REQ_PROFILER_START_STATE_SEARCH;

@Service
public class ProfilerStateProcessor extends AbstractCommand<String> {

    private static final Logger logger = LoggerFactory.getLogger(ProfilerStateProcessor.class);

    @Resource
    private ProfilerManager profilerManager;

    @Override
    public Set<Integer> getCodes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_PROFILER_STATE_SEARCH.getCode());
    }

    @Override
    public int getMinAgentVersion() {
        return 12;
    }

    @Override
    public boolean supportMulti() {
        return false;
    }

    @Override
    protected String prepareCommand(RequestData<String> data, String agentId) {
        return data.getCommand() + BistouryConstants.PID_PARAM + BistouryConstants.FILL_PID;
    }

    @Override
    public Datagram prepareResponse(Datagram datagram) {
        try {
            Optional<TypeResponse<Map<String, String>>> responseRef = ProfilerDatagramHelper.getProfilerResponse(datagram);
            if (responseRef.isPresent()) {
                String type = getStateSearchType(responseRef.get());
                String status = getProfilerStatus(responseRef.get());
                changeDbStatus(type, status, ProfilerDatagramHelper.getProfilerId(responseRef.get()));
            }
        } catch (Exception e) {
            logger.error("get profiler state error.", e);
        }
        return datagram;
    }

    public static final String RUNNING_STATUS = "running";

    public static final String FINISH_STATUS = "finish";

    public static final String ERROR_STATUS = "error";

    private void changeDbStatus(String type, String status, String profilerId) {
        if (ERROR_STATUS.equals(status)) {
            profilerManager.stopWithError(profilerId);
            return;
        } else if (FINISH_STATUS.equals(status)) {
            profilerManager.stop(profilerId);
            return;
        }
        if (REQ_PROFILER_START_STATE_SEARCH.equals(type)) {
            if (RUNNING_STATUS.equals(status)) {
                profilerManager.start(profilerId);
            }
        }
    }

    private String getStateSearchType(TypeResponse<Map<String, String>> response) {
        return response.getData().getData().get("type");
    }

    private String getProfilerStatus(TypeResponse<Map<String, String>> response) {
        return response.getData().getData().get("status");
    }
}
