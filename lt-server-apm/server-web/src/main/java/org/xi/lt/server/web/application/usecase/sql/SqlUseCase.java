package org.xi.lt.server.web.application.usecase.sql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.PageSearchResult;
import org.xi.lt.server.domain.model.SortDirection;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.SpanQueryRepository;
import org.xi.lt.server.web.interfaces.http.api.dto.SqlListRequest;
import org.xi.lt.server.web.shared.model.PageResult;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

@Service
public class SqlUseCase {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private SpanQueryRepository spanRepo;

    public PageResult<SpanView> list(SqlListRequest req) {
        int pageNum = req == null || req.getPageNum() == null ? 1 : req.getPageNum();
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());
        String env = req == null ? "" : safe(req.getEnv());
        String app = req == null ? "" : safe(req.getApp());
        String sort = req == null ? "" : safe(req.getSort());
        String gid = req == null ? "" : safe(req.getGid());
        String ip = req == null ? "" : safe(req.getIp());

        String sortField = "time";
        if ("spend".equals(sort)) sortField = "spend";
        if ("count".equals(sort)) sortField = "tags.count";

        try {
            SpanPageQuery q = new SpanPageQuery();
            q.setType("sql");
            q.setBeginMs(beginMs);
            q.setEndMs(endMs);
            q.setEnv(env);
            q.setApp(app);
            q.setGid(gid);
            q.setIp(ip);
            q.setSortField(sortField);
            q.setSortDirection(SortDirection.DESC);
            q.setFrom((pageNum - 1) * PAGE_SIZE);
            q.setSize(PAGE_SIZE);
            PageSearchResult<SpanView> r = spanRepo.searchPage(q);
            return new PageResult<>(r.getRows(), pageNum, (int) r.getTotal());
        } catch (Exception e) {
            return PageResult.empty(pageNum);
        }
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }
}
