package org.xi.lt.server.web.diagnostic.proxy.communicate.ui.handler.commandprocessor.processor;

import com.google.common.base.Strings;
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

@Service
public class ProfilerStopProcessor extends AbstractCommand<String> {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProfilerStopProcessor.class);

    @Resource
    private ProfilerManager profilerManager;

    @Override
    public Set<Integer> getCodes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_PROFILER_STOP.getCode());
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
            if (responseRef.isPresent() && isSuccess(responseRef.get())) {
                String profilerId = ProfilerDatagramHelper.getProfilerId(responseRef.get());
                if (Strings.isNullOrEmpty(profilerId)) {
                    return datagram;
                } else {
                    profilerManager.stop(profilerId);
                }
            }
        } catch (Exception e) {
            LOGGER.error("stop profiler error.", e);
        }
        return datagram;
    }

    private boolean isSuccess(TypeResponse<Map<String, String>> response) {
        return ProfilerDatagramHelper.getResultState(response);
    }
}
