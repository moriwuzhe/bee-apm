package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.UmlSequenceDiagram;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * UML 时序图生成器
 * 将 UML 时序图数据模型转换为 PlantUML 格式
 */
@Slf4j
public class UmlSequenceDiagramGenerator {

    /**
     * 生成 UML 时序图的 PlantUML 格式
     */
    public String generatePlantUml(UmlSequenceDiagram diagram) {
        StringBuilder plantuml = new StringBuilder();

        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor white\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam shadowing true\n");
        plantuml.append("skinparam sequenceMessageAlign center\n");
        plantuml.append("skinparam noteBackgroundColor #fff9c4\n");
        plantuml.append("skinparam noteBorderColor #ffc107\n");
        plantuml.append("skinparam sequenceParticipant {\n");
        plantuml.append("  BackgroundColor #e3f2fd\n");
        plantuml.append("  BorderColor #1976d2\n");
        plantuml.append("}\n");
        plantuml.append("skinparam sequenceArrow {\n");
        plantuml.append("  Color #1976d2\n");
        plantuml.append("  Thickness 2\n");
        plantuml.append("}\n");
        plantuml.append("skinparam boxPadding 10\n");
        plantuml.append("\n");
        if (diagram.getName() != null && !diagram.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(diagram.getName())).append("\n");
        }
        plantuml.append("\n");

        // 定义所有参与者
        for (UmlSequenceDiagram.Participant participant : diagram.getParticipants()) {
            plantuml.append(generateParticipantDeclaration(participant));
        }

        plantuml.append("\n");

        // 生成所有消息
        for (UmlSequenceDiagram.Message message : diagram.getMessages()) {
            plantuml.append(generateMessage(message));
        }

        plantuml.append("@enduml\n");

        return plantuml.toString();
    }

    /**
     * 别名方法，保持兼容性
     */
    public String generateDot(UmlSequenceDiagram diagram) {
        return generatePlantUml(diagram);
    }
    
    /**
     * 生成参与者声明
     */
    private String generateParticipantDeclaration(UmlSequenceDiagram.Participant participant) {
        StringBuilder line = new StringBuilder();

        switch (participant.getType()) {
            case ACTOR:
                line.append("actor ");
                break;
            case BOUNDARY:
                line.append("boundary ");
                break;
            case CONTROL:
                line.append("control ");
                break;
            case ENTITY:
                line.append("entity ");
                break;
            case OBJECT:
            default:
                line.append("participant ");
                break;
        }

        line.append("\"").append(escapeLabel(participant.getName())).append("\"");
        line.append(" as ").append(cleanId(participant.getId()));
        line.append("\n");

        return line.toString();
    }

    /**
     * 清理ID，确保只包含合法字符
     */
    private String cleanId(String id) {
        if (id == null || id.isEmpty()) {
            return "unknown";
        }
        // 只保留字母、数字和下划线
        String clean = id.replaceAll("[^a-zA-Z0-9_]", "_");
        // 确保不以数字开头
        if (clean.isEmpty() || Character.isDigit(clean.charAt(0))) {
            clean = "p_" + clean;
        }
        return clean;
    }
    
    /**
     * 生成消息
     */
    private String generateMessage(UmlSequenceDiagram.Message message) {
        StringBuilder line = new StringBuilder();

        String from = cleanId(message.getFromParticipantId());
        String to = cleanId(message.getToParticipantId());

        // 自调用
        if (message.isSelfCall()) {
            line.append(from).append(" -> ").append(to).append(" : ");
            line.append(escapeLabel(message.getName()));
            line.append("\n");
            return line.toString();
        }

        // 返回消息
        if (message.isReturn()) {
            line.append(from).append(" --> ").append(to).append(" : ");
            line.append(escapeLabel(message.getName()));
            line.append("\n");
            return line.toString();
        }

        // 普通消息
        switch (message.getType()) {
            case SYNCHRONOUS:
                line.append(from).append(" -> ").append(to).append(" : ");
                break;
            case ASYNCHRONOUS:
                line.append(from).append(" ->> ").append(to).append(" : ");
                break;
            case RETURN:
                line.append(from).append(" --> ").append(to).append(" : ");
                break;
            case CREATE:
                line.append(from).append(" -> ").append(to).append(" : create ");
                break;
            case DESTROY:
                line.append(from).append(" -> ").append(to).append(" : destroy ");
                break;
            default:
                line.append(from).append(" -> ").append(to).append(" : ");
                break;
        }

        line.append(escapeLabel(message.getName()));
        line.append("\n");

        return line.toString();
    }
    
    /**
     * 保存 PlantUML 到文件
     */
    public void saveToFile(UmlSequenceDiagram diagram, File outputFile) throws IOException {
        String plantuml = generatePlantUml(diagram);

        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(plantuml);
        }

        log.info("PlantUML UML 时序图已保存到: {}", outputFile.getAbsolutePath());
    }

    /**
     * 转义标签中的特殊字符
     */
    private String escapeLabel(String label) {
        if (label == null) {
            return "";
        }
        // 转义引号和换行符
        return label.replace("\"", "'").replace("\n", " ").replace("\r", " ");
    }
}
