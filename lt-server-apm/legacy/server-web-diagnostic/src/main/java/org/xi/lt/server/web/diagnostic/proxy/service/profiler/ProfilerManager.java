package org.xi.lt.server.web.diagnostic.proxy.service.profiler;

import org.xi.lt.server.web.diagnostic.serverside.bean.ProfilerSettings;

/**
 * @author cai.wen created on 2019/10/30 16:54
 */
public interface ProfilerManager {

    String prepare(String agentId, ProfilerSettings settings);

    void start(String profilerId);

    void stop(String profilerId);

    void stopWithError(String profilerId);
}
