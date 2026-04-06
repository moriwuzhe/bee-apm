package org.xi.lt.server.web.diagnostic.ui.service;

import org.xi.lt.server.web.diagnostic.serverside.bean.Profiler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * @author cai.wen created on 2019/11/4 12:52
 */
public interface ProfilerService {

    Profiler getRecord(String profilerId);

    List<Profiler> getLastRecords(String app, String agentId, LocalDateTime startTime);

    Optional<Profiler> getLastProfilerRecord(String app, String agentId);
}
