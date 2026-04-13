package org.xi.lt.server.web.application.usecase.app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.PageSearchResult;
import org.xi.lt.server.domain.model.SortDirection;
import org.xi.lt.server.domain.model.app.AppInstanceView;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.SpanQueryRepository;
import org.xi.lt.server.web.interfaces.http.api.dto.AppInfoListRequest;
import org.xi.lt.server.web.shared.model.PageResult;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

import java.util.List;
import java.util.ArrayList;

@Service
public class AppInfoUseCase {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private SpanQueryRepository spanRepo;

    public PageResult<AppInstanceView> list(AppInfoListRequest req) {
        int pageNum = req == null || req.getPageNum() == null ? 1 : req.getPageNum();
        String beginTime = req == null ? null : req.getBeginTime();
        String endTime = req == null ? null : req.getEndTime();
        long beginMs = TimeParseUtils.parseMillis(beginTime);
        long endMs = TimeParseUtils.parseMillis(endTime);
        String env = req == null ? "" : safe(req.getEnv());
        String app = req == null ? "" : safe(req.getApp());
        String ip = req == null ? "" : safe(req.getIp());

        SpanPageQuery q = new SpanPageQuery();
        q.setType("hb");
        q.setBeginMs(beginMs);
        q.setEndMs(endMs);
        q.setEnv(env);
        q.setApp(app);
        q.setIp(ip);
        q.setSortField("time");
        q.setSortDirection(SortDirection.DESC);
        q.setFrom((pageNum - 1) * PAGE_SIZE);
        q.setSize(PAGE_SIZE);

        try {
            PageSearchResult<SpanView> r = spanRepo.searchPage(q);
            List<AppInstanceView> rows = new ArrayList<>();
            for (SpanView row : r.getRows()) {
                AppInstanceView out = new AppInstanceView();
                out.setApp(row.getApp());
                out.setInst(row.getInst());
                out.setIp(row.getIp());
                out.setEnv(row.getEnv());
                out.setTime(row.getTime());
                if (row.getTags() instanceof org.xi.lt.server.domain.model.span.tags.HeartbeatTags) {
                    out.setTags((org.xi.lt.server.domain.model.span.tags.HeartbeatTags) row.getTags());
                }
                out.setOnline(true);
                rows.add(out);
            }
            return new PageResult<>(rows, pageNum, (int) r.getTotal());
        } catch (Exception e) {
            return PageResult.empty(pageNum);
        }
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }
}
