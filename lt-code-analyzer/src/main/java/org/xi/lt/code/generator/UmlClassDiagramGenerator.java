package org.xi.lt.code.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.code.model.UmlClassDiagram;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * UML 类图生成器
 * 将 UML 类图数据模型转换为 Graphviz DOT 格式
 */
@Slf4j
public class UmlClassDiagramGenerator {
    
    /**
     * 生成 UML 类图的 DOT 格式
     */
    public String generateDot(UmlClassDiagram diagram) {
        StringBuilder dot = new StringBuilder();
        
        dot.append("digraph UmlClassDiagram {\n");
        dot.append("    rankdir=TB;\n");
        dot.append("    node [shape=record, fontname=\"Arial\"];\n");
        dot.append("    edge [fontname=\"Arial\"];\n");
        dot.append("\n");
        
        // 生成所有类节点
        for (UmlClassDiagram.UmlClass clazz : diagram.getClasses()) {
            dot.append(generateClassNode(clazz));
        }
        
        dot.append("\n");
        
        // 生成所有关系
        for (UmlClassDiagram.UmlRelationship relationship : diagram.getRelationships()) {
            dot.append(generateRelationship(relationship));
        }
        
        dot.append("}\n");
        
        return dot.toString();
    }
    
    /**
     * 生成单个类的节点
     */
    private String generateClassNode(UmlClassDiagram.UmlClass clazz) {
        StringBuilder node = new StringBuilder();
        
        String nodeId = clazz.getClassName().replace(".", "_").replace("$", "_");
        String label = generateClassLabel(clazz);
        
        // 选择颜色
        String color = getClassColor(clazz.getClassType());
        
        node.append(String.format("    %s [label=%s, style=filled, fillcolor=%s];\n", 
                nodeId, escapeLabel(label), color));
        
        return node.toString();
    }
    
    /**
     * 生成类的标签（包含类名、属性、方法）
     */
    private String generateClassLabel(UmlClassDiagram.UmlClass clazz) {
        StringBuilder label = new StringBuilder();
        label.append("{");
        
        // 类名部分
        String stereotype = getStereotype(clazz.getClassType());
        if (!stereotype.isEmpty()) {
            label.append("&laquo;").append(stereotype).append("&raquo;\\n");
        }
        label.append(clazz.getSimpleName());
        
        // 如果有属性
        if (clazz.getAttributes() != null && !clazz.getAttributes().isEmpty()) {
            label.append("|");
            for (UmlClassDiagram.UmlAttribute attr : clazz.getAttributes()) {
                String visibility = attr.getVisibility().getSymbol();
                label.append(visibility).append(attr.getName())
                        .append(": ").append(attr.getType());
                if (attr.isStatic()) {
                    label.append(" {static}");
                }
                label.append("\\l");
            }
        }
        
        // 如果有方法
        if (clazz.getMethods() != null && !clazz.getMethods().isEmpty()) {
            label.append("|");
            for (UmlClassDiagram.UmlMethod method : clazz.getMethods()) {
                String visibility = method.getVisibility().getSymbol();
                label.append(visibility).append(method.getName()).append("(");
                
                // 参数
                if (method.getParameters() != null && !method.getParameters().isEmpty()) {
                    for (int i = 0; i < method.getParameters().size(); i++) {
                        UmlClassDiagram.UmlParameter param = method.getParameters().get(i);
                        label.append(param.getName()).append(": ").append(param.getType());
                        if (i < method.getParameters().size() - 1) {
                            label.append(", ");
                        }
                    }
                }
                
                label.append("): ").append(method.getReturnType());
                
                // 静态或抽象
                if (method.isStatic()) {
                    label.append(" {static}");
                }
                if (method.isAbstract()) {
                    label.append(" {abstract}");
                }
                
                label.append("\\l");
            }
        }
        
        label.append("}");
        return label.toString();
    }
    
    /**
     * 生成关系
     */
    private String generateRelationship(UmlClassDiagram.UmlRelationship relationship) {
        String sourceId = relationship.getSourceClassName().replace(".", "_").replace("$", "_");
        String targetId = relationship.getTargetClassName().replace(".", "_").replace("$", "_");
        
        StringBuilder edge = new StringBuilder();
        edge.append("    ").append(sourceId).append(" -> ").append(targetId);
        
        // 根据关系类型设置样式
        String style = getRelationshipStyle(relationship.getType());
        if (!style.isEmpty()) {
            edge.append(" [").append(style).append("]");
        }
        
        edge.append(";\n");
        return edge.toString();
    }
    
    /**
     * 获取类的颜色
     */
    private String getClassColor(UmlClassDiagram.UmlClass.ClassType type) {
        switch (type) {
            case INTERFACE:
                return "#E0FFFF"; // 浅蓝色
            case ABSTRACT_CLASS:
                return "#FFF0E0"; // 浅橙色
            case ENUM:
                return "#FFFFE0"; // 浅黄色
            case CLASS:
            default:
                return "#E0FFE0"; // 浅绿色
        }
    }
    
    /**
     * 获取构造型（stereotype）
     */
    private String getStereotype(UmlClassDiagram.UmlClass.ClassType type) {
        switch (type) {
            case INTERFACE:
                return "interface";
            case ABSTRACT_CLASS:
                return "abstract";
            case ENUM:
                return "enum";
            case CLASS:
            default:
                return "";
        }
    }
    
    /**
     * 获取关系的样式
     */
    private String getRelationshipStyle(UmlClassDiagram.UmlRelationship.RelationshipType type) {
        switch (type) {
            case INHERITANCE:
                return "arrowhead=empty, style=solid, color=black";
            case REALIZATION:
                return "arrowhead=empty, style=dashed, color=black";
            case ASSOCIATION:
                return "arrowhead=open, style=solid, color=black";
            case AGGREGATION:
                return "arrowhead=open, style=solid, color=black, arrowtail=diamond, dir=back";
            case COMPOSITION:
                return "arrowhead=open, style=solid, color=black, arrowtail=ediamond, dir=back";
            case DEPENDENCY:
                return "arrowhead=open, style=dashed, color=black";
            default:
                return "";
        }
    }
    
    /**
     * 转义标签字符串
     */
    private String escapeLabel(String label) {
        return "\"" + label.replace("\"", "\\\"") + "\"";
    }
    
    /**
     * 保存 DOT 到文件
     */
    public void saveToFile(UmlClassDiagram diagram, File outputFile) throws IOException {
        String dot = generateDot(diagram);
        
        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(dot);
        }
        
        log.info("UML 类图已保存到: {}", outputFile.getAbsolutePath());
    }
}
