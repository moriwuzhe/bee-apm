package org.xi.lt.server.web.domain.repository;

import org.xi.lt.server.web.domain.model.dashboard.FromToCount;

import java.util.List;

public interface DashboardQueryRepository {
    long countByType(long beginMs, long endMs, String env, String app, String ip, String type);

    long countDistinctInst(long beginMs, long endMs, String env, String app, String ip);

    List<FromToCount> topologyFromTo(long beginMs, long endMs);
}
