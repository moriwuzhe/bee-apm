package org.xi.lt.server.web.diagnostic.proxy.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xi.lt.server.web.diagnostic.common.BistouryConstants;
import org.xi.lt.server.web.diagnostic.proxy.dao.ProfilerLockDao;
import org.xi.lt.server.web.diagnostic.proxy.service.profiler.ProfilerManager;
import org.xi.lt.server.web.diagnostic.proxy.service.profiler.ProfilerService;
import org.xi.lt.server.web.diagnostic.serverside.bean.Profiler;
import org.xi.lt.server.web.diagnostic.serverside.bean.ProfilerSettings;

import javax.annotation.Resource;

/**
 * @author cai.wen created on 2019/10/30 16:54
 */
@Service
public class DefaultProfilerManager implements ProfilerManager {

    @Resource
    private ProfilerService profilerService;

    @Resource
    private ProfilerLockDao profilerLockDao;

    @Override
    @Transactional
    public String prepare(String agentId, ProfilerSettings settings) {
        profilerLockDao.insert(settings.getAppCode(), agentId);
        String profilerId = profilerService.prepareProfiler(agentId, settings);
        String command = settings.getCommand().replace(BistouryConstants.PROFILER_ID, profilerId)
                + BistouryConstants.PID_PARAM + BistouryConstants.FILL_PID;
        settings.setCommand(command);
        return profilerId;
    }

    @Override
    @Transactional
    public void start(String profilerId) {
        profilerService.startProfiler(profilerId);
    }

    @Override
    @Transactional
    public void stop(String profilerId) {
        if (isStopped(profilerId)) {
            return;
        }
        Profiler profiler = profilerService.getProfilerRecord(profilerId);
        profilerLockDao.delete(profiler.getAppCode(), profiler.getAgentId());
        profilerService.stopProfiler(profilerId);
    }

    @Override
    @Transactional
    public void stopWithError(String profilerId) {
        Profiler profiler = profilerService.getProfilerRecord(profilerId);
        profilerLockDao.delete(profiler.getAppCode(), profiler.getAgentId());
        profilerService.stopWithError(profilerId);
    }

    private boolean isStopped(String profilerId) {
        Profiler profiler = profilerService.getProfilerRecord(profilerId);
        Profiler.State state = profiler.getState();
        return state != Profiler.State.ready && state != Profiler.State.start;
    }
}

