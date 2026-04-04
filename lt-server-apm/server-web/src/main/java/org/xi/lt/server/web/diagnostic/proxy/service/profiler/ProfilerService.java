package org.xi.lt.server.web.diagnostic.proxy.service.profiler;

import org.xi.lt.server.web.diagnostic.serverside.bean.Profiler;
import org.xi.lt.server.web.diagnostic.serverside.bean.ProfilerSettings;

/**
 * @author cai.wen created on 2019/10/30 14:50
 */
public interface ProfilerService {

    void startProfiler(String profilerId);

    String prepareProfiler(String agentId, ProfilerSettings profilerSettings);

    Profiler getProfilerRecord(String profilerId);

    void stopProfiler(String profilesId);

    void stopWithError(String profilerId);
}
