package org.xi.lt.server.web.domain.repository;

import org.xi.lt.server.web.domain.model.PageSearchResult;
import org.xi.lt.server.web.domain.model.query.SpanPageQuery;
import org.xi.lt.server.web.domain.model.span.SpanView;

import java.util.List;

public interface SpanQueryRepository {
    PageSearchResult<SpanView> searchPage(SpanPageQuery query) throws Exception;

    List<SpanView> searchByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception;

    List<SpanView> searchByGidAny(String gid, long beginMs, long endMs, int max) throws Exception;
}
