package org.xi.lt.flow.dynamic;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.model.span.tags.MethTags;
import org.xi.lt.server.domain.model.span.tags.ReqTags;
import org.xi.lt.server.domain.model.span.tags.SpanTags;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Span 数据到 FlowGraph 转换器
 * 将 APM 采集的 Span 数据转换为流程图模型
 */
@Slf4j
public class SpanToFlowGraphConverter {

    /**
     * 将 SpanView 列表转换为 FlowGraph
     */
    public FlowGraph convert(List<SpanView> spans, String traceId) {
        log.info("开始转换 Span 数据，traceId: {}, Span 数量: {}", traceId, spans.size());

        FlowGraph graph = FlowGraph.builder()
                .name("Trace-" + traceId)
                .description("从 APM Trace 生成的流程图，Trace ID: " + traceId)
                .build();

        // 按时间排序
        List<SpanView> sortedSpans = spans.stream()
                .sorted(Comparator.comparing(SpanView::getTime))
                .collect(Collectors.toList());

        // 创建节点
        Map<String, FlowNode> nodeMap = new HashMap<>();
        for (SpanView span : sortedSpans) {
            FlowNode node = createNodeFromSpan(span);
            if (node != null) {
                nodeMap.put(span.getId(), node);
                graph.addNode(node);
            }
        }

        // 设置入口节点（第一个节点）
        if (!sortedSpans.isEmpty()) {
            FlowNode entryNode = nodeMap.get(sortedSpans.get(0).getId());
            graph.setEntryNode(entryNode);
        }

        // 创建边（基于父子关系）
        for (SpanView span : sortedSpans) {
            String parentId = span.getPid();
            if (parentId != null && !parentId.isEmpty()) {
                FlowNode sourceNode = nodeMap.get(parentId);
                FlowNode targetNode = nodeMap.get(span.getId());
                if (sourceNode != null && targetNode != null) {
                    FlowEdge edge = FlowEdge.builder()
                            .source(sourceNode)
                            .target(targetNode)
                            .callType(FlowEdge.CallType.DIRECT)
                            .callCount(1)
                            .build();
                    graph.addEdge(edge);
                }
            }
        }

        // 如果没有父子关系，按时间顺序创建边
        if (graph.getEdges().isEmpty() && sortedSpans.size() > 1) {
            for (int i = 0; i < sortedSpans.size() - 1; i++) {
                FlowNode sourceNode = nodeMap.get(sortedSpans.get(i).getId());
                FlowNode targetNode = nodeMap.get(sortedSpans.get(i + 1).getId());
                if (sourceNode != null && targetNode != null) {
                    FlowEdge edge = FlowEdge.builder()
                            .source(sourceNode)
                            .target(targetNode)
                            .callType(FlowEdge.CallType.DIRECT)
                            .callCount(1)
                            .build();
                    graph.addEdge(edge);
                }
            }
        }

        log.info("转换完成！节点数: {}, 边数: {}", graph.getNodeCount(), graph.getEdgeCount());
        return graph;
    }

    /**
     * 从 Span 创建 FlowNode
     */
    private FlowNode createNodeFromSpan(SpanView span) {
        String spanId = span.getId();
        String type = span.getType();
        String app = span.getApp();
        String displayName = extractDisplayName(span);

        FlowNode.NodeType nodeType = determineNodeType(type);

        return FlowNode.builder()
                .id(spanId)
                .type(nodeType)
                .className(app)
                .methodName(displayName)
                .displayName(displayName)
                .metadata(extractMetadata(span))
                .build();
    }

    /**
     * 提取显示名称
     */
    private String extractDisplayName(SpanView span) {
        String type = span.getType();
        SpanTags tags = span.getTags();

        StringBuilder sb = new StringBuilder();

        // 添加应用名
        if (span.getApp() != null) {
            sb.append(span.getApp());
        }

        // 根据类型添加详细信息
        if ("req".equals(type) && tags instanceof ReqTags) {
            ReqTags reqTags = (ReqTags) tags;
            if (reqTags.getUrl() != null) {
                sb.append(" ").append(reqTags.getMethod()).append(" ").append(reqTags.getUrl());
            }
        } else if (("meth".equals(type) || "proc".equals(type)) && tags instanceof MethTags) {
            MethTags methTags = (MethTags) tags;
            if (methTags.getMethod() != null) {
                sb.append("#").append(methTags.getMethod());
            }
        } else if ("sql".equals(type)) {
            sb.append(" SQL");
        } else if ("tx".equals(type)) {
            sb.append(" Transaction");
        } else if ("log".equals(type)) {
            sb.append(" Log");
        } else if ("err".equals(type)) {
            sb.append(" Error");
        } else if (type != null) {
            sb.append(" ").append(type);
        }

        // 添加耗时
        if (span.getSpend() != null) {
            sb.append(" [").append(span.getSpend()).append("ms]");
        }

        return sb.toString();
    }

    /**
     * 确定节点类型
     */
    private FlowNode.NodeType determineNodeType(String type) {
        if ("req".equals(type)) {
            return FlowNode.NodeType.METHOD;
        } else if ("meth".equals(type) || "proc".equals(type)) {
            return FlowNode.NodeType.METHOD;
        } else if ("sql".equals(type)) {
            return FlowNode.NodeType.EXTERNAL;
        } else if ("tx".equals(type)) {
            return FlowNode.NodeType.METHOD;
        } else if ("log".equals(type)) {
            return FlowNode.NodeType.EXTERNAL;
        } else if ("err".equals(type)) {
            return FlowNode.NodeType.EXTERNAL;
        }
        return FlowNode.NodeType.METHOD;
    }

    /**
     * 提取元数据
     */
    private Map<String, Object> extractMetadata(SpanView span) {
        Map<String, Object> metadata = new HashMap<>();

        metadata.put("spanId", span.getId());
        metadata.put("traceId", span.getGid());
        metadata.put("parentId", span.getPid());
        metadata.put("type", span.getType());
        metadata.put("app", span.getApp());
        metadata.put("instance", span.getInst());
        metadata.put("ip", span.getIp());
        metadata.put("port", span.getPort());
        metadata.put("timestamp", span.getTime());
        metadata.put("duration", span.getSpend());
        metadata.put("error", span.getError());

        // 添加标签信息
        SpanTags tags = span.getTags();
        if (tags instanceof ReqTags) {
            ReqTags reqTags = (ReqTags) tags;
            metadata.put("url", reqTags.getUrl());
            metadata.put("httpMethod", reqTags.getMethod());
            metadata.put("remote", reqTags.getRemote());
            metadata.put("sourceApp", reqTags.getSrcApp());
        } else if (tags instanceof MethTags) {
            MethTags methTags = (MethTags) tags;
            metadata.put("method", methTags.getMethod());
            metadata.put("params", methTags.getParam());
        }

        return metadata;
    }
}
