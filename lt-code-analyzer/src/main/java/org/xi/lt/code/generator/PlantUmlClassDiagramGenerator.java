package org.xi.lt.code.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.code.model.UmlClassDiagram;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * PlantUML UML 类图生成器
 * 将 UML 类图数据模型转换为 PlantUML 格式
 */
@Slf4j
public class PlantUmlClassDiagramGenerator {

    /**
     * 生成 PlantUML 格式的 UML 类图
     */
    public String generatePlantUml(UmlClassDiagram diagram) {
        StringBuilder plantuml = new StringBuilder();

        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam shadowing false\n");
        plantuml.append("hide circle\n");
        plantuml.append("hide empty members\n");
        plantuml.append("\n");

        // 定义所有类
        for (UmlClassDiagram.UmlClass clazz : diagram.getClasses()) {
            plantuml.append(generateClassDefinition(clazz));
        }

        plantuml.append("\n");

        // 定义所有关系
        for (UmlClassDiagram.UmlRelationship relationship : diagram.getRelationships()) {
            plantuml.append(generateRelationship(relationship));
        }

        plantuml.append("@enduml\n");

        return plantuml.toString();
    }

    /**
     * 生成类定义
     */
    private String generateClassDefinition(UmlClassDiagram.UmlClass clazz) {
        StringBuilder sb = new StringBuilder();

        // 根据类类型添加前缀
        switch (clazz.getClassType()) {
            case INTERFACE:
                sb.append("interface ");
                break;
            case ABSTRACT_CLASS:
                sb.append("abstract class ");
                break;
            case ENUM:
                sb.append("enum ");
                break;
            case CLASS:
            default:
                sb.append("class ");
                break;
        }

        // 添加类名
        String className = clazz.getSimpleName() != null ? clazz.getSimpleName() : clazz.getClassName();
        sb.append("\"").append(escapeLabel(className)).append("\" as ");
        sb.append(getClassId(clazz.getClassName())).append(" {\n");

        // 添加属性
        for (UmlClassDiagram.UmlAttribute attr : clazz.getAttributes()) {
            sb.append("    ");
            sb.append(getVisibilitySymbol(attr.getVisibility()));
            if (attr.isStatic()) {
                sb.append("{static} ");
            }
            sb.append(escapeLabel(attr.getName()));
            sb.append(" : ");
            sb.append(escapeLabel(attr.getType()));
            sb.append("\n");
        }

        // 添加方法
        for (UmlClassDiagram.UmlMethod method : clazz.getMethods()) {
            sb.append("    ");
            sb.append(getVisibilitySymbol(method.getVisibility()));
            if (method.isStatic()) {
                sb.append("{static} ");
            }
            if (method.isAbstract()) {
                sb.append("{abstract} ");
            }
            sb.append(escapeLabel(method.getName()));
            sb.append("(");

            // 添加参数
            boolean firstParam = true;
            for (UmlClassDiagram.UmlParameter param : method.getParameters()) {
                if (!firstParam) {
                    sb.append(", ");
                }
                sb.append(escapeLabel(param.getName()));
                sb.append(" : ");
                sb.append(escapeLabel(param.getType()));
                firstParam = false;
            }

            sb.append(")");
            if (method.getReturnType() != null && !method.getReturnType().isEmpty() && !method.getReturnType().equals("void")) {
                sb.append(" : ");
                sb.append(escapeLabel(method.getReturnType()));
            }
            sb.append("\n");
        }

        sb.append("}\n\n");

        return sb.toString();
    }

    /**
     * 生成关系
     */
    private String generateRelationship(UmlClassDiagram.UmlRelationship relationship) {
        StringBuilder sb = new StringBuilder();

        String sourceId = getClassId(relationship.getSourceClassName());
        String targetId = getClassId(relationship.getTargetClassName());

        switch (relationship.getType()) {
            case INHERITANCE:
                // 继承关系：子类 <|-- 父类
                sb.append(sourceId).append(" <|-- ").append(targetId).append("\n");
                break;
            case REALIZATION:
                // 实现关系：类 ..|> 接口
                sb.append(sourceId).append(" ..|> ").append(targetId).append("\n");
                break;
            case ASSOCIATION:
                // 关联关系
                sb.append(sourceId).append(" --> ").append(targetId).append("\n");
                break;
            case AGGREGATION:
                // 聚合关系：整体 o-- 部分
                sb.append(sourceId).append(" o-- ").append(targetId).append("\n");
                break;
            case COMPOSITION:
                // 组合关系：整体 *-- 部分
                sb.append(sourceId).append(" *-- ").append(targetId).append("\n");
                break;
            case DEPENDENCY:
            default:
                // 依赖关系
                sb.append(sourceId).append(" ..> ").append(targetId).append("\n");
                break;
        }

        return sb.toString();
    }

    /**
     * 获取可见性符号
     */
    private String getVisibilitySymbol(UmlClassDiagram.UmlAttribute.Visibility visibility) {
        if (visibility == null) {
            return "~";
        }
        switch (visibility) {
            case PUBLIC:
                return "+";
            case PRIVATE:
                return "-";
            case PROTECTED:
                return "#";
            case PACKAGE:
            default:
                return "~";
        }
    }

    /**
     * 获取类的 PlantUML ID（去除特殊字符）
     */
    private String getClassId(String className) {
        if (className == null) {
            return "UnknownClass";
        }
        // 替换特殊字符为下划线
        return className.replaceAll("[^a-zA-Z0-9_]", "_");
    }

    /**
     * 转义标签中的特殊字符
     */
    private String escapeLabel(String label) {
        if (label == null) {
            return "";
        }
        return label.replace("\"", "'")
                .replace("\n", " ");
    }

    /**
     * 保存 PlantUML 到文件
     */
    public void saveToFile(UmlClassDiagram diagram, File outputFile) throws IOException {
        String plantuml = generatePlantUml(diagram);

        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(plantuml);
        }

        log.info("PlantUML UML 类图已保存到: {}", outputFile.getAbsolutePath());
    }
}
