package org.xi.lt.server.web.application.usecase.request;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.PageSearchResult;
import org.xi.lt.server.domain.model.SortDirection;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.request.CallTreeNode;
import org.xi.lt.server.domain.model.request.TopologyEdge;
import org.xi.lt.server.domain.model.request.TopologyGraph;
import org.xi.lt.server.domain.model.request.TopologyNode;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.SpanQueryRepository;
import org.xi.lt.server.web.interfaces.http.api.dto.RequestGidTimeRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.RequestListRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.model.PageResult;
import org.xi.lt.server.web.shared.util.ResultHelper;
import org.xi.lt.server.web.shared.util.TimeParseUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
public class RequestUseCase {
    private static final int PAGE_SIZE = 20;

    @Autowired
    private SpanQueryRepository spanRepo;

    public PageResult<SpanView> list(RequestListRequest req) {
        int pageNum = req == null || req.getPageNum() == null ? 1 : req.getPageNum();
        long beginMs = TimeParseUtils.parseMillis(req == null ? null : req.getBeginTime());
        long endMs = TimeParseUtils.parseMillis(req == null ? null : req.getEndTime());
        String env = req == null ? "" : safe(req.getEnv());
        String app = req == null ? "" : safe(req.getApp());
        String sort = req == null ? "" : safe(req.getSort());
        String gid = req == null ? "" : safe(req.getGid());
        String ip = req == null ? "" : safe(req.getIp());
        String url = req == null ? "" : safe(req.getUrl());
        if (url.isEmpty() && req != null) {
            url = safe(req.getEntry());
        }
        String remote = req == null ? "" : safe(req.getRemote());
        long minSpend = req == null || req.getMinSpend() == null ? -1 : req.getMinSpend();
        long maxSpend = req == null || req.getMaxSpend() == null ? -1 : req.getMaxSpend();

        String sortField = "time";
        if ("spend".equals(sort)) sortField = "spend";

        try {
            SpanPageQuery q = new SpanPageQuery();
            q.setType("req");
            q.setBeginMs(beginMs);
            q.setEndMs(endMs);
            q.setEnv(env);
            q.setApp(app);
            q.setGid(gid);
            q.setIp(ip);
            q.setTagsRemoteLike(remote);
            q.setTagsUrlLike(url);
            q.setMinSpend(minSpend);
            q.setMaxSpend(maxSpend);
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

    public ApiResult<List<CallTreeNode>> callTree(RequestGidTimeRequest req) {
        String gid = req == null ? "" : safe(req.getGid());
        String time = req == null ? "" : safe(req.getTime());
        try {
            long t = TimeParseUtils.parseMillis(time);
            long begin = t - 30 * 60 * 1000L;
            long end = t + 30 * 60 * 1000L;
            CallTreeNode tree = buildCallTree(gid, begin, end);
            List<CallTreeNode> out = new ArrayList<>();
            if (tree != null) out.add(tree);
            return ResultHelper.success(out);
        } catch (Exception e) {
            return ResultHelper.success(new ArrayList<>());
        }
    }

    public ApiResult<TopologyGraph> topology(RequestGidTimeRequest req) {
        String gid = req == null ? "" : safe(req.getGid());
        String time = req == null ? "" : safe(req.getTime());
        try {
            long t = TimeParseUtils.parseMillis(time);
            long begin = t - 30 * 60 * 1000L;
            long end = t + 30 * 60 * 1000L;
            TopologyGraph topo = buildTopology(gid, begin, end);
            return ResultHelper.success(topo);
        } catch (Exception e) {
            return ResultHelper.success(new TopologyGraph());
        }
    }

    private CallTreeNode buildCallTree(String gid, long beginMs, long endMs) throws Exception {
        List<SpanView> spans = spanRepo.searchByGidAny(gid, beginMs, endMs, 10000);
        if (spans.isEmpty()) return null;

        SpanView rootSpan = null;
        for (SpanView s : spans) {
            if ("req".equals(s == null ? null : s.getType())) {
                rootSpan = s;
                break;
            }
        }
        if (rootSpan == null) {
            rootSpan = spans.get(0);
        }

        HashMap<String, CallTreeNode> nodeById = new HashMap<>();
        for (SpanView s : spans) {
            String id = s == null ? "" : safe(s.getId());
            if (id.isEmpty()) continue;
            nodeById.put(id, nodeFromSpan(s));
        }

        String rootId = rootSpan == null ? "" : safe(rootSpan.getId());
        CallTreeNode root = nodeById.get(rootId);
        if (root == null) {
            root = nodeFromSpan(rootSpan);
            nodeById.put(rootId, root);
        }

        for (SpanView s : spans) {
            String id = s == null ? "" : safe(s.getId());
            if (id.isEmpty() || id.equals(rootId)) continue;
            CallTreeNode node = nodeById.get(id);
            if (node == null) continue;
            String pid = s == null ? "" : safe(s.getPid());
            CallTreeNode parent = pid.isEmpty() ? null : nodeById.get(pid);
            if (parent == null) {
                root.getChildren().add(node);
            } else {
                parent.getChildren().add(node);
            }
        }

        return root;
    }

    private CallTreeNode nodeFromSpan(SpanView span) {
        CallTreeNode node = new CallTreeNode();
        if (span == null) return node;
        String type = safe(span.getType());
        node.setId(span.getId());
        node.setGid(span.getGid());
        node.setTime(span.getTime());
        node.setType(type);
        node.setApp(span.getApp());
        node.setSpend(span.getSpend());
        node.setText(buildSpanText(type, span.getTags()));
        return node;
    }

    private String buildSpanText(String type, org.xi.lt.server.domain.model.span.tags.SpanTags tags) {
        if (tags == null) return type;
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.ReqTags) {
            org.xi.lt.server.domain.model.span.tags.ReqTags req = (org.xi.lt.server.domain.model.span.tags.ReqTags) tags;
            return (safe(req.getMethod()) + " " + safe(req.getUrl())).trim();
        }
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.MethTags) {
            return safe(((org.xi.lt.server.domain.model.span.tags.MethTags) tags).getMethod());
        }
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.SqlTags) {
            return safe(((org.xi.lt.server.domain.model.span.tags.SqlTags) tags).getSql());
        }
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.TxTags) {
            return safe(((org.xi.lt.server.domain.model.span.tags.TxTags) tags).getTx());
        }
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.LogTags) {
            org.xi.lt.server.domain.model.span.tags.LogTags log = (org.xi.lt.server.domain.model.span.tags.LogTags) tags;
            return (safe(log.getLevel()) + " " + safe(log.getMsg())).trim();
        }
        if (tags instanceof org.xi.lt.server.domain.model.span.tags.ErrorTags) {
            return safe(((org.xi.lt.server.domain.model.span.tags.ErrorTags) tags).getError());
        }
        return type;
    }

    private TopologyGraph buildTopology(String gid, long beginMs, long endMs) throws Exception {
        List<SpanView> reqs = spanRepo.searchByGid("req", gid, beginMs, endMs, 2000);
        if (reqs.isEmpty()) return new TopologyGraph();
        SpanView r = reqs.get(0);
        String app = safe(r.getApp());
        String inst = safe(r.getInst());
        String srcApp = "";
        String srcInst = "";
        if (r.getTags() instanceof org.xi.lt.server.domain.model.span.tags.ReqTags) {
            org.xi.lt.server.domain.model.span.tags.ReqTags req = (org.xi.lt.server.domain.model.span.tags.ReqTags) r.getTags();
            srcApp = safe(req.getSrcApp());
            srcInst = safe(req.getSrcInst());
        }

        List<TopologyNode> nodes = new ArrayList<>();
        List<TopologyEdge> edges = new ArrayList<>();
        if (!srcApp.isEmpty()) {
            nodes.add(node(srcApp, srcInst));
        }
        nodes.add(node(app, inst));
        if (!srcApp.isEmpty()) {
            edges.add(edge(srcApp + "@" + srcInst, app + "@" + inst));
        }
        TopologyGraph out = new TopologyGraph();
        out.setNodes(nodes);
        out.setEdges(edges);
        return out;
    }

    private TopologyNode node(String app, String inst) {
        TopologyNode n = new TopologyNode();
        n.setId(app + "@" + inst);
        n.setApp(app);
        n.setInst(inst);
        n.setLabel(app);
        return n;
    }

    private TopologyEdge edge(String source, String target) {
        TopologyEdge e = new TopologyEdge();
        e.setSource(source);
        e.setTarget(target);
        return e;
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }
}
