package org.xi.lt.server.web.diagnostic.proxy.service.profiler;

import org.xi.lt.server.web.diagnostic.serverside.bean.ProfilerSettings;

import java.util.Map;

public interface ProfilerSettingsManager {

    ProfilerSettings create(String appCode, Map<String, String> config);
}
