package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * PlantUML 方法调用链生成器
 * 将方法调用链数据模型转换为 PlantUML 格式
 */
@Slf4j
public class PlantUmlCallChainGenerator {

    /**
     * 图表样式类型
     */
    public enum DiagramStyle {
        ACTIVITY,       // 活动图
        SEQUENCE,       // 时序图
        COMPONENT,      // 组件图
        STATE,          // 状态图
        MINDMAP         // 思维导图
    }

    /**
     * 生成 PlantUML 格式的方法调用链（使用活动图样式）
     */
    public String generatePlantUml(FlowGraph graph) {
        return generatePlantUml(graph, DiagramStyle.ACTIVITY);
    }

    /**
     * 生成指定样式的 PlantUML 格式的方法调用链
     */
    public String generatePlantUml(FlowGraph graph, DiagramStyle style) {
        switch (style) {
            case SEQUENCE:
                return generateSequenceDiagram(graph);
            case COMPONENT:
                return generateComponentDiagram(graph);
            case STATE:
                return generateStateDiagram(graph);
            case MINDMAP:
                return generateMindmapDiagram(graph);
            case ACTIVITY:
            default:
                return generateActivityDiagram(graph);
        }
    }

    /**
     * 生成活动图格式
     */
    private String generateActivityDiagram(FlowGraph graph) {
        StringBuilder plantuml = new StringBuilder();

        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam shadowing false\n");
        plantuml.append("\n");

        // 使用最简单的活动图格式
        int count = 0;
        java.util.Set<String> shownLabels = new java.util.HashSet<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                // 跳过一些可能有问题的节点
                if (sourceLabel.contains("call(") || targetLabel.contains("call(") ||
                    sourceLabel.isEmpty() || targetLabel.isEmpty() ||
                    sourceLabel.length() > 60 || targetLabel.length() > 60) {
                    continue;
                }

                // 添加源节点（如果还没显示过）
                if (!shownLabels.contains(sourceLabel)) {
                    plantuml.append(":").append(sourceLabel).append(";\n");
                    shownLabels.add(sourceLabel);
                }

                // 添加箭头和目标节点
                plantuml.append("-->").append(":").append(targetLabel).append(";\n");
                shownLabels.add(targetLabel);

                count++;
                // 最多显示15个关系避免太乱
                if (count >= 15) {
                    break;
                }
            }
        }

        // 如果没有显示任何关系，就显示一个简单的示例
        if (count == 0) {
            plantuml.append(":Start;\n");
            plantuml.append("-->:End;\n");
        }

        plantuml.append("@enduml\n");

        return plantuml.toString();
    }

    /**
     * 获取简化的节点标签
     */
    private String getSimpleNodeLabel(FlowNode node) {
        if (node.getType() == FlowNode.NodeType.METHOD) {
            String className = node.getClassName() != null ? node.getClassName() : "";
            String methodName = node.getMethodName() != null ? node.getMethodName() : "";
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : methodName;

            // 只显示简单类名和方法名
            if (!className.isEmpty()) {
                String simpleClassName = className;
                int lastDot = className.lastIndexOf('.');
                if (lastDot > 0) {
                    simpleClassName = className.substring(lastDot + 1);
                }
                // 如果方法名太长或奇怪，只显示类名
                if (displayName.length() > 50 || displayName.contains("(") && displayName.contains(")")) {
                    return simpleClassName;
                }
                return simpleClassName + "." + displayName;
            }
            return displayName;
        } else {
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : node.getClassName();
            if (displayName != null) {
                int lastDot = displayName.lastIndexOf('.');
                if (lastDot > 0) {
                    return displayName.substring(lastDot + 1);
                }
            }
            return displayName;
        }
    }

    /**
     * 获取节点显示标签
     */
    private String getNodeLabel(FlowNode node) {
        if (node.getType() == FlowNode.NodeType.METHOD) {
            String className = node.getClassName() != null ? node.getClassName() : "";
            String methodName = node.getMethodName() != null ? node.getMethodName() : "";
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : methodName;

            // 只显示简单类名和方法名
            if (!className.isEmpty()) {
                String simpleClassName = className;
                int lastDot = className.lastIndexOf('.');
                if (lastDot > 0) {
                    simpleClassName = className.substring(lastDot + 1);
                }
                return simpleClassName + "." + displayName + "()";
            }
            return displayName + "()";
        } else {
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : node.getClassName();
            if (displayName != null) {
                int lastDot = displayName.lastIndexOf('.');
                if (lastDot > 0) {
                    return displayName.substring(lastDot + 1);
                }
            }
            return displayName;
        }
    }

    /**
     * 获取节点的 PlantUML ID（去除特殊字符）
     */
    private String getNodeId(FlowNode node) {
        String id = node.getFullId();
        if (id == null) {
            id = "node_" + System.identityHashCode(node);
        }
        // 替换特殊字符为下划线
        return id.replaceAll("[^a-zA-Z0-9_]", "_");
    }

    /**
     * 转义标签中的特殊字符
     */
    private String escapeLabel(String label) {
        if (label == null) {
            return "";
        }
        return label.replace("\"", "'")
                .replace("\n", " ")
                .replace(";", ",");
    }

    /**
     * 保存 PlantUML 到文件
     */
    public void saveToFile(FlowGraph graph, File outputFile) throws IOException {
        String plantuml = generatePlantUml(graph);

        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(plantuml);
        }

        log.info("PlantUML 方法调用链已保存到: {}", outputFile.getAbsolutePath());
    }

    /**
     * 生成时序图格式
     */
    private String generateSequenceDiagram(FlowGraph graph) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("\n");

        int count = 0;
        java.util.Set<String> participants = new java.util.HashSet<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                if (sourceLabel.contains("call(") || targetLabel.contains("call(") ||
                    sourceLabel.isEmpty() || targetLabel.isEmpty()) {
                    continue;
                }

                if (!participants.contains(sourceLabel)) {
                    plantuml.append("participant \"").append(sourceLabel).append("\"\n");
                    participants.add(sourceLabel);
                }
                if (!participants.contains(targetLabel)) {
                    plantuml.append("participant \"").append(targetLabel).append("\"\n");
                    participants.add(targetLabel);
                }

                plantuml.append("\"").append(sourceLabel).append("\" -> \"")
                        .append(targetLabel).append("\"\n");

                count++;
                if (count >= 15) break;
            }
        }

        if (count == 0) {
            plantuml.append("participant Start\n");
            plantuml.append("participant End\n");
            plantuml.append("Start -> End\n");
        }

        plantuml.append("@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成组件图格式
     */
    private String generateComponentDiagram(FlowGraph graph) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam componentStyle rectangle\n");
        plantuml.append("\n");

        int count = 0;
        java.util.Set<String> components = new java.util.HashSet<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceId = getNodeId(edge.getSource());
                String targetId = getNodeId(edge.getTarget());
                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                if (sourceLabel.contains("call(") || targetLabel.contains("call(") ||
                    sourceLabel.isEmpty() || targetLabel.isEmpty()) {
                    continue;
                }

                if (!components.contains(sourceId)) {
                    plantuml.append("component \"").append(sourceLabel).append("\" as ").append(sourceId).append("\n");
                    components.add(sourceId);
                }
                if (!components.contains(targetId)) {
                    plantuml.append("component \"").append(targetLabel).append("\" as ").append(targetId).append("\n");
                    components.add(targetId);
                }

                plantuml.append(sourceId).append(" --> ").append(targetId).append("\n");

                count++;
                if (count >= 20) break;
            }
        }

        if (count == 0) {
            plantuml.append("component \"Start\" as start\n");
            plantuml.append("component \"End\" as end\n");
            plantuml.append("start --> end\n");
        }

        plantuml.append("@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成状态图格式
     */
    private String generateStateDiagram(FlowGraph graph) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("\n");

        int count = 0;
        java.util.Set<String> states = new java.util.HashSet<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                if (sourceLabel.contains("call(") || targetLabel.contains("call(") ||
                    sourceLabel.isEmpty() || targetLabel.isEmpty()) {
                    continue;
                }

                String sourceState = "state_" + Math.abs(sourceLabel.hashCode());
                String targetState = "state_" + Math.abs(targetLabel.hashCode());

                if (!states.contains(sourceState)) {
                    plantuml.append("state \"").append(sourceLabel).append("\" as ").append(sourceState).append("\n");
                    states.add(sourceState);
                }
                if (!states.contains(targetState)) {
                    plantuml.append("state \"").append(targetLabel).append("\" as ").append(targetState).append("\n");
                    states.add(targetState);
                }

                plantuml.append(sourceState).append(" --> ").append(targetState).append("\n");

                count++;
                if (count >= 15) break;
            }
        }

        if (count == 0) {
            plantuml.append("state \"Start\" as start\n");
            plantuml.append("state \"End\" as end\n");
            plantuml.append("start --> end\n");
        }

        plantuml.append("@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成思维导图格式
     */
    private String generateMindmapDiagram(FlowGraph graph) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startmindmap\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("\n");

        int count = 0;
        java.util.Set<String> added = new java.util.HashSet<>();
        String rootLabel = null;

        // 找一个根节点
        for (FlowNode node : graph.getAllNodes()) {
            String label = escapeLabel(getSimpleNodeLabel(node));
            if (!label.contains("call(") && !label.isEmpty()) {
                rootLabel = label;
                break;
            }
        }

        if (rootLabel != null) {
            plantuml.append("* ").append(rootLabel).append("\n");
            added.add(rootLabel);

            for (FlowEdge edge : graph.getEdges()) {
                if (edge.getSource() != null && edge.getTarget() != null) {
                    String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                    String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                    if (sourceLabel.contains("call(") || targetLabel.contains("call(") ||
                        sourceLabel.isEmpty() || targetLabel.isEmpty()) {
                        continue;
                    }

                    if (rootLabel.equals(sourceLabel) && !added.contains(targetLabel)) {
                        plantuml.append("** ").append(targetLabel).append("\n");
                        added.add(targetLabel);
                        count++;
                    }

                    if (count >= 10) break;
                }
            }
        }

        if (rootLabel == null) {
            plantuml.append("* Start\n");
            plantuml.append("** End\n");
        }

        plantuml.append("@endmindmap\n");
        return plantuml.toString();
    }
}
