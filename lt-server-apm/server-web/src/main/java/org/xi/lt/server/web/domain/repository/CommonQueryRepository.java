package org.xi.lt.server.web.domain.repository;

import org.xi.lt.server.web.domain.model.common.KeyValue;

import java.util.List;

public interface CommonQueryRepository {
    List<KeyValue> groupList(long beginMs, long endMs, String groupField);

    Object queryById(String indexPrefix, String id, long beginMs, long endMs);
}
