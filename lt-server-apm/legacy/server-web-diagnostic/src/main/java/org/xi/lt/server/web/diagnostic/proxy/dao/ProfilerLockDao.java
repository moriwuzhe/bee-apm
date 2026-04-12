package org.xi.lt.server.web.diagnostic.proxy.dao;

public interface ProfilerLockDao {

    void insert(String appCode, String agentId);

    void delete(String appCode, String agentId);
}
