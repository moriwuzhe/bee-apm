package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;
import org.xi.lt.flow.model.UmlSequenceDiagram;

import java.util.*;

/**
 * FlowGraph 到 UML 时序图转换器
 * 将方法调用链转换为时序图展示
 */
@Slf4j
public class FlowToSequenceDiagramConverter {

    /**
     * 将 FlowGraph 转换为 UML 时序图
     */
    public UmlSequenceDiagram convert(FlowGraph graph) {
        UmlSequenceDiagram diagram = UmlSequenceDiagram.builder()
                .name(graph.getName())
                .description("从方法调用链生成的时序图")
                .build();

        // 收集所有参与者（类）
        Map<String, UmlSequenceDiagram.Participant> participants = new LinkedHashMap<>();
        collectParticipants(graph, participants);

        // 添加参与者到图表
        participants.values().forEach(diagram::addParticipant);

        // 生成消息序列
        List<UmlSequenceDiagram.Message> messages = new ArrayList<>();
        generateMessages(graph, participants, messages);

        // 添加消息到图表
        messages.forEach(diagram::addMessage);

        log.info("转换完成！参与者数: {}, 消息数: {}",
                diagram.getParticipants().size(), diagram.getMessages().size());

        return diagram;
    }

    /**
     * 收集所有参与者
     */
    private void collectParticipants(FlowGraph graph,
                                      Map<String, UmlSequenceDiagram.Participant> participants) {
        // 首先收集所有类节点
        for (FlowNode node : graph.getAllNodes()) {
            if (node.getType() == FlowNode.NodeType.CLASS) {
                String participantId = getParticipantId(node.getClassName());
                if (!participants.containsKey(participantId)) {
                    UmlSequenceDiagram.Participant participant = UmlSequenceDiagram.Participant.builder()
                            .id(participantId)
                            .name(node.getDisplayName() != null ? node.getDisplayName() : node.getClassName())
                            .type(UmlSequenceDiagram.Participant.ParticipantType.OBJECT)
                            .build();
                    participants.put(participantId, participant);
                }
            }
        }

        // 然后收集所有方法所属的类
        for (FlowNode node : graph.getAllNodes()) {
            if (node.getType() == FlowNode.NodeType.METHOD && node.getClassName() != null) {
                String participantId = getParticipantId(node.getClassName());
                if (!participants.containsKey(participantId)) {
                    String simpleName = getSimpleClassName(node.getClassName());
                    UmlSequenceDiagram.Participant participant = UmlSequenceDiagram.Participant.builder()
                            .id(participantId)
                            .name(simpleName)
                            .type(UmlSequenceDiagram.Participant.ParticipantType.OBJECT)
                            .build();
                    participants.put(participantId, participant);
                }
            }
        }
    }

    /**
     * 生成消息序列
     */
    private void generateMessages(FlowGraph graph,
                                    Map<String, UmlSequenceDiagram.Participant> participants,
                                    List<UmlSequenceDiagram.Message> messages) {
        // 构建调用关系图，找出入口节点
        Map<String, List<FlowEdge>> outgoingEdges = new HashMap<>();
        Map<String, List<FlowEdge>> incomingEdges = new HashMap<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceId = edge.getSource().getId();
                String targetId = edge.getTarget().getId();

                outgoingEdges.computeIfAbsent(sourceId, k -> new ArrayList<>()).add(edge);
                incomingEdges.computeIfAbsent(targetId, k -> new ArrayList<>()).add(edge);
            }
        }

        // 寻找入口方法（没有入边或者入边最少的方法节点）
        FlowNode entryNode = findEntryNode(graph, incomingEdges);

        if (entryNode != null) {
            // 使用 BFS 生成消息序列
            int sequence = 1;
            Set<String> visited = new HashSet<>();
            Queue<FlowNode> queue = new LinkedList<>();
            queue.add(entryNode);
            visited.add(entryNode.getId());

            while (!queue.isEmpty()) {
                FlowNode current = queue.poll();
                List<FlowEdge> edges = outgoingEdges.get(current.getId());

                if (edges != null) {
                    for (FlowEdge edge : edges) {
                        FlowNode target = edge.getTarget();
                        if (target != null && !visited.contains(target.getId())) {
                            // 创建消息
                            UmlSequenceDiagram.Message message = createMessage(
                                    sequence++, current, target, edge);
                            if (message != null) {
                                messages.add(message);
                            }

                            visited.add(target.getId());
                            queue.add(target);
                        } else if (target != null) {
                            // 已访问过的节点也创建消息，但不重复入队
                            UmlSequenceDiagram.Message message = createMessage(
                                    sequence++, current, target, edge);
                            if (message != null) {
                                messages.add(message);
                            }
                        }
                    }
                }
            }
        } else {
            // 没有明确的入口节点，按顺序处理所有边
            int sequence = 1;
            for (FlowEdge edge : graph.getEdges()) {
                if (edge.getSource() != null && edge.getTarget() != null) {
                    UmlSequenceDiagram.Message message = createMessage(
                            sequence++, edge.getSource(), edge.getTarget(), edge);
                    if (message != null) {
                        messages.add(message);
                    }
                }
            }
        }
    }

    /**
     * 查找入口节点
     */
    private FlowNode findEntryNode(FlowGraph graph,
                                     Map<String, List<FlowEdge>> incomingEdges) {
        // 优先使用图中设置的入口节点
        if (graph.getEntryNode() != null) {
            return graph.getEntryNode();
        }

        // 寻找入边最少的方法节点
        FlowNode bestNode = null;
        int minIncoming = Integer.MAX_VALUE;

        for (FlowNode node : graph.getAllNodes()) {
            if (node.getType() == FlowNode.NodeType.METHOD) {
                int incomingCount = incomingEdges.getOrDefault(node.getId(), Collections.emptyList()).size();
                if (incomingCount < minIncoming) {
                    minIncoming = incomingCount;
                    bestNode = node;
                }
            }
        }

        return bestNode;
    }

    /**
     * 创建消息
     */
    private UmlSequenceDiagram.Message createMessage(int sequence,
                                                       FlowNode source,
                                                       FlowNode target,
                                                       FlowEdge edge) {
        String fromParticipantId = getParticipantId(source.getClassName());
        String toParticipantId = getParticipantId(target.getClassName());

        // 如果是同一个类，可能是自调用
        boolean isSelfCall = fromParticipantId.equals(toParticipantId) &&
                source.getType() == FlowNode.NodeType.METHOD &&
                target.getType() == FlowNode.NodeType.METHOD;

        String messageName = buildMessageName(source, target);

        return UmlSequenceDiagram.Message.builder()
                .sequence(sequence)
                .fromParticipantId(fromParticipantId)
                .toParticipantId(toParticipantId)
                .name(messageName)
                .type(UmlSequenceDiagram.Message.MessageType.SYNCHRONOUS)
                .isSelfCall(isSelfCall)
                .isReturn(false)
                .build();
    }

    /**
     * 构建消息名称
     */
    private String buildMessageName(FlowNode source, FlowNode target) {
        StringBuilder sb = new StringBuilder();

        if (source.getMethodName() != null) {
            sb.append(source.getMethodName()).append(" → ");
        }

        if (target.getMethodName() != null) {
            sb.append(target.getMethodName()).append("()");
        } else if (target.getDisplayName() != null) {
            sb.append(target.getDisplayName());
        } else {
            sb.append(target.getId());
        }

        return sb.toString();
    }

    /**
     * 获取参与者ID
     */
    private String getParticipantId(String className) {
        if (className == null || className.isEmpty()) {
            return "Unknown";
        }
        // 只保留字母、数字和下划线，确保ID合法
        String cleanId = className.replaceAll("[^a-zA-Z0-9_]", "_");
        // 确保ID不以数字开头
        if (cleanId.isEmpty() || Character.isDigit(cleanId.charAt(0))) {
            cleanId = "p_" + cleanId;
        }
        return cleanId;
    }

    /**
     * 获取简单类名
     */
    private String getSimpleClassName(String className) {
        if (className == null) {
            return "Unknown";
        }
        int lastDot = className.lastIndexOf('.');
        if (lastDot >= 0) {
            return className.substring(lastDot + 1);
        }
        return className;
    }
}
