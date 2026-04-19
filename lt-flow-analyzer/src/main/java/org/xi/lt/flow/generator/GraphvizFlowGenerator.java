package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * 简单的Graphviz流程图生成器
 * 直接生成DOT格式字符串，不依赖复杂的Graphviz Java库
 */
@Slf4j
public class GraphvizFlowGenerator {
    
    /**
     * 生成Graphviz DOT格式字符串
     */
    public String generateDot(FlowGraph graph) {
        log.info("开始生成Graphviz DOT格式");
        
        StringBuilder dot = new StringBuilder();
        dot.append("digraph FlowGraph {\n");
        dot.append("    rankdir=TB;\n");
        dot.append("    node [shape=box, style=filled, fillcolor=lightblue];\n");
        dot.append("    edge [color=gray];\n");
        dot.append("\n");
        
        // 添加所有节点
        for (FlowNode node : graph.getAllNodes()) {
            String nodeId = sanitizeNodeId(node.getFullId());
            String label = generateNodeLabel(node);
            
            dot.append("    ").append(nodeId).append(" [label=\"").append(label).append("\"");
            
            // 根据节点类型设置不同的颜色
            if (node.getType() == FlowNode.NodeType.CLASS) {
                dot.append(", fillcolor=lightgreen");
            } else {
                dot.append(", fillcolor=lightyellow");
            }
            
            dot.append("];\n");
        }
        
        dot.append("\n");
        
        // 添加所有边
        for (FlowEdge edge : graph.getEdges()) {
            String sourceId = sanitizeNodeId(edge.getSource().getFullId());
            String targetId = sanitizeNodeId(edge.getTarget().getFullId());
            
            dot.append("    ").append(sourceId).append(" -> ").append(targetId);
            
            // 根据调用类型设置不同的样式
            switch (edge.getCallType()) {
                case CONDITIONAL:
                    dot.append(" [style=dashed, color=orange, label=\"if\"]");
                    break;
                case LOOP:
                    dot.append(" [style=dashed, color=purple, label=\"loop\"]");
                    break;
                case RECURSIVE:
                    dot.append(" [style=dashed, color=red, label=\"recursive\"]");
                    break;
                case INDIRECT:
                    dot.append(" [style=dotted, color=blue]");
                    break;
                default:
                    // DIRECT - 使用默认样式
                    break;
            }
            
            // 如果有调用次数，添加标签
            if (edge.getCallCount() > 1) {
                dot.append(" [label=\"x").append(edge.getCallCount()).append("\"]");
            }
            
            dot.append(";\n");
        }
        
        dot.append("}\n");
        
        log.info("Graphviz DOT格式生成完成");
        return dot.toString();
    }
    
    /**
     * 保存DOT格式到文件
     */
    public File saveDotToFile(FlowGraph graph, File outputFile) throws IOException {
        log.info("保存DOT文件: {}", outputFile.getAbsolutePath());
        
        String dot = generateDot(graph);
        
        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(dot);
        }
        
        log.info("DOT文件保存完成");
        return outputFile;
    }
    
    /**
     * 生成节点标签
     */
    private String generateNodeLabel(FlowNode node) {
        if (node.getType() == FlowNode.NodeType.CLASS) {
            // 类节点：只显示类名（简化显示）
            String simpleName = node.getClassName();
            int lastDot = simpleName.lastIndexOf('.');
            if (lastDot > 0) {
                simpleName = simpleName.substring(lastDot + 1);
            }
            return "<<" + simpleName + ">>";
        } else {
            // 方法节点：显示方法名
            return node.getMethodName() + "()";
        }
    }
    
    /**
     * 清理节点ID（移除特殊字符）
     */
    private String sanitizeNodeId(String nodeId) {
        return nodeId.replaceAll("[^a-zA-Z0-9_]", "_");
    }
}
