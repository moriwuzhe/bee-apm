package org.xi.lt.flow.diff;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 流程图差异分析服务 - 对比两个 FlowGraph 找出变化
 */
@Slf4j
public class FlowGraphDiffService {

    /**
     * 差异分析结果
     */
    public static class DiffResult {
        private final FlowGraph oldGraph;
        private final FlowGraph newGraph;

        private final List<FlowNode> addedNodes;
        private final List<FlowNode> removedNodes;
        private final List<FlowNode> unchangedNodes;

        private final List<FlowEdge> addedEdges;
        private final List<FlowEdge> removedEdges;
        private final List<FlowEdge> unchangedEdges;

        public DiffResult(FlowGraph oldGraph, FlowGraph newGraph) {
            this.oldGraph = oldGraph;
            this.newGraph = newGraph;

            this.addedNodes = new ArrayList<>();
            this.removedNodes = new ArrayList<>();
            this.unchangedNodes = new ArrayList<>();

            this.addedEdges = new ArrayList<>();
            this.removedEdges = new ArrayList<>();
            this.unchangedEdges = new ArrayList<>();
        }

        public void calculate() {
            calculateNodeDiff();
            calculateEdgeDiff();
        }

        private void calculateNodeDiff() {
            Set<String> oldNodeIds = oldGraph.getAllNodes().stream()
                    .map(FlowNode::getId)
                    .collect(Collectors.toSet());
            Set<String> newNodeIds = newGraph.getAllNodes().stream()
                    .map(FlowNode::getId)
                    .collect(Collectors.toSet());

            for (FlowNode node : oldGraph.getAllNodes()) {
                if (newNodeIds.contains(node.getId())) {
                    unchangedNodes.add(node);
                } else {
                    removedNodes.add(node);
                }
            }

            for (FlowNode node : newGraph.getAllNodes()) {
                if (!oldNodeIds.contains(node.getId())) {
                    addedNodes.add(node);
                }
            }
        }

        private void calculateEdgeDiff() {
            Set<String> oldEdgeKeys = oldGraph.getEdges().stream()
                    .map(this::getEdgeKey)
                    .collect(Collectors.toSet());
            Set<String> newEdgeKeys = newGraph.getEdges().stream()
                    .map(this::getEdgeKey)
                    .collect(Collectors.toSet());

            Map<String, FlowEdge> oldEdgeMap = oldGraph.getEdges().stream()
                    .collect(Collectors.toMap(this::getEdgeKey, e -> e));
            Map<String, FlowEdge> newEdgeMap = newGraph.getEdges().stream()
                    .collect(Collectors.toMap(this::getEdgeKey, e -> e));

            for (String key : oldEdgeKeys) {
                if (newEdgeKeys.contains(key)) {
                    unchangedEdges.add(oldEdgeMap.get(key));
                } else {
                    removedEdges.add(oldEdgeMap.get(key));
                }
            }

            for (String key : newEdgeKeys) {
                if (!oldEdgeKeys.contains(key)) {
                    addedEdges.add(newEdgeMap.get(key));
                }
            }
        }

        private String getEdgeKey(FlowEdge edge) {
            String sourceId = edge.getSource() != null ? edge.getSource().getId() : "null";
            String targetId = edge.getTarget() != null ? edge.getTarget().getId() : "null";
            return sourceId + "|" + targetId;
        }

        public FlowGraph getOldGraph() { return oldGraph; }
        public FlowGraph getNewGraph() { return newGraph; }
        public List<FlowNode> getAddedNodes() { return addedNodes; }
        public List<FlowNode> getRemovedNodes() { return removedNodes; }
        public List<FlowNode> getUnchangedNodes() { return unchangedNodes; }
        public List<FlowEdge> getAddedEdges() { return addedEdges; }
        public List<FlowEdge> getRemovedEdges() { return removedEdges; }
        public List<FlowEdge> getUnchangedEdges() { return unchangedEdges; }

        public int getTotalChanges() {
            return addedNodes.size() + removedNodes.size() + addedEdges.size() + removedEdges.size();
        }

        public boolean hasChanges() {
            return getTotalChanges() > 0;
        }

        public DiffResultResponse toResponse() {
            return DiffResultResponse.builder()
                    .hasChanges(hasChanges())
                    .totalChanges(getTotalChanges())
                    .addedNodes(nodeListToInfo(addedNodes))
                    .removedNodes(nodeListToInfo(removedNodes))
                    .unchangedNodes(nodeListToInfo(unchangedNodes))
                    .addedEdges(edgeListToInfo(addedEdges))
                    .removedEdges(edgeListToInfo(removedEdges))
                    .unchangedEdges(edgeListToInfo(unchangedEdges))
                    .stats(DiffStats.builder()
                            .oldNodeCount(oldGraph.getNodeCount())
                            .newNodeCount(newGraph.getNodeCount())
                            .oldEdgeCount(oldGraph.getEdgeCount())
                            .newEdgeCount(newGraph.getEdgeCount())
                            .nodeDiff(addedNodes.size() - removedNodes.size())
                            .edgeDiff(addedEdges.size() - removedEdges.size())
                            .build())
                    .build();
        }

        private List<DiffNodeInfo> nodeListToInfo(List<FlowNode> nodes) {
            return nodes.stream()
                    .map(DiffNodeInfo::from)
                    .collect(Collectors.toList());
        }

        private List<DiffEdgeInfo> edgeListToInfo(List<FlowEdge> edges) {
            return edges.stream()
                    .map(DiffEdgeInfo::from)
                    .collect(Collectors.toList());
        }
    }

    /**
     * 对比两个流程图
     */
    public DiffResult compare(FlowGraph oldGraph, FlowGraph newGraph) {
        log.info("开始对比流程图: 旧节点数={}, 新节点数={}",
                oldGraph.getNodeCount(), newGraph.getNodeCount());

        DiffResult result = new DiffResult(oldGraph, newGraph);
        result.calculate();

        log.info("对比完成: 新增节点={}, 删除节点={}, 新增边={}, 删除边={}",
                result.getAddedNodes().size(), result.getRemovedNodes().size(),
                result.getAddedEdges().size(), result.getRemovedEdges().size());

        return result;
    }

    /**
     * 生成带高亮的差异图（使用新增为绿色，删除为红色）
     */
    public FlowGraph generateHighlightedDiffGraph(DiffResult diffResult) {
        FlowGraph diffGraph = FlowGraph.builder()
                .name("差异对比: " + diffResult.getOldGraph().getName() + " vs " + diffResult.getNewGraph().getName())
                .build();

        Map<String, FlowNode> nodeMap = new HashMap<>();

        for (FlowNode node : diffResult.getUnchangedNodes()) {
            FlowNode newNode = cloneNodeWithStatus(node, "UNCHANGED");
            nodeMap.put(newNode.getId(), newNode);
            diffGraph.addNode(newNode);
        }

        for (FlowNode node : diffResult.getAddedNodes()) {
            FlowNode newNode = cloneNodeWithStatus(node, "ADDED");
            nodeMap.put(newNode.getId(), newNode);
            diffGraph.addNode(newNode);
        }

        for (FlowNode node : diffResult.getRemovedNodes()) {
            FlowNode newNode = cloneNodeWithStatus(node, "REMOVED");
            nodeMap.put(newNode.getId(), newNode);
            diffGraph.addNode(newNode);
        }

        for (FlowEdge edge : diffResult.getUnchangedEdges()) {
            FlowEdge newEdge = cloneEdgeWithStatus(edge, nodeMap, "UNCHANGED");
            if (newEdge != null) {
                diffGraph.addEdge(newEdge);
            }
        }

        for (FlowEdge edge : diffResult.getAddedEdges()) {
            FlowEdge newEdge = cloneEdgeWithStatus(edge, nodeMap, "ADDED");
            if (newEdge != null) {
                diffGraph.addEdge(newEdge);
            }
        }

        for (FlowEdge edge : diffResult.getRemovedEdges()) {
            FlowEdge newEdge = cloneEdgeWithStatus(edge, nodeMap, "REMOVED");
            if (newEdge != null) {
                diffGraph.addEdge(newEdge);
            }
        }

        return diffGraph;
    }

    private FlowNode cloneNodeWithStatus(FlowNode node, String status) {
        FlowNode newNode = FlowNode.builder()
                .id(node.getId())
                .type(node.getType())
                .className(node.getClassName())
                .methodName(node.getMethodName())
                .displayName(node.getDisplayName())
                .methodSignature(node.getMethodSignature())
                .build();
        return newNode;
    }

    private FlowEdge cloneEdgeWithStatus(FlowEdge edge, Map<String, FlowNode> nodeMap, String status) {
        FlowNode source = edge.getSource() != null ? nodeMap.get(edge.getSource().getId()) : null;
        FlowNode target = edge.getTarget() != null ? nodeMap.get(edge.getTarget().getId()) : null;

        if (source == null || target == null) {
            return null;
        }

        FlowEdge newEdge = new FlowEdge();
        newEdge.setSource(source);
        newEdge.setTarget(target);
        newEdge.setCallType(edge.getCallType());
        newEdge.setCallCount(edge.getCallCount());
        newEdge.setCondition(edge.getCondition());
        return newEdge;
    }
}
