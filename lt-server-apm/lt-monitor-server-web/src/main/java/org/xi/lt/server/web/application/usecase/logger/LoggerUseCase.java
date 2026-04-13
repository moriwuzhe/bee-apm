package org.xi.lt.server.web.application.usecase.logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.PageSearchResult;
import org.xi.lt.server.domain.model.SortDirection;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.SpanQueryRepository;
import org.xi.lt.server.web.interfaces.http.api.dto.LoggerListRequest;
import org.xi.lt.server.web.shared.model.PageResult;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

@Service
public class LoggerUseCase {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private SpanQueryRepository spanRepo;

    public PageResult<SpanView> list(LoggerListRequest req) {
        int pageNum = req == null || req.getPageNum() == null ? 1 : req.getPageNum();
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());
        String env = req == null ? "" : safe(req.getEnv());
        String app = req == null ? "" : safe(req.getApp());
        String gid = req == null ? "" : safe(req.getGid());
        String ip = req == null ? "" : safe(req.getIp());
        String content = req == null ? "" : safe(req.getContent());

        SpanPageQuery q = new SpanPageQuery();
        q.setType("log");
        q.setBeginMs(beginMs);
        q.setEndMs(endMs);
        q.setEnv(env);
        q.setApp(app);
        q.setGid(gid);
        q.setIp(ip);
        q.setTagsLogLike(content);
        q.setSortField("time");
        q.setSortDirection(SortDirection.DESC);
        q.setFrom((pageNum - 1) * PAGE_SIZE);
        q.setSize(PAGE_SIZE);

        try {
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
