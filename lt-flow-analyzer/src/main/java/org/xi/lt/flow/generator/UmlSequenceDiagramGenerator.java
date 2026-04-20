package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.UmlSequenceDiagram;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * UML 时序图生成器
 * 将 UML 时序图数据模型转换为 Graphviz DOT 格式
 * 使用 mscgen 语法（兼容 Graphviz）
 */
@Slf4j
public class UmlSequenceDiagramGenerator {
    
    /**
     * 生成 UML 时序图的 DOT 格式
     */
    public String generateDot(UmlSequenceDiagram diagram) {
        StringBuilder dot = new StringBuilder();
        
        dot.append("@startuml\n");
        dot.append("skinparam backgroundColor white\n");
        dot.append("skinparam handwritten false\n");
        dot.append("\n");
        
        // 定义所有参与者
        for (UmlSequenceDiagram.Participant participant : diagram.getParticipants()) {
            dot.append(generateParticipantDeclaration(participant));
        }
        
        dot.append("\n");
        
        // 生成所有消息
        for (UmlSequenceDiagram.Message message : diagram.getMessages()) {
            dot.append(generateMessage(message));
        }
        
        dot.append("@enduml\n");
        
        return dot.toString();
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
        
        line.append("\"").append(participant.getName()).append("\"");
        line.append(" as ").append(participant.getId());
        line.append("\n");
        
        return line.toString();
    }
    
    /**
     * 生成消息
     */
    private String generateMessage(UmlSequenceDiagram.Message message) {
        StringBuilder line = new StringBuilder();
        
        String from = message.getFromParticipantId();
        String to = message.getToParticipantId();
        
        // 自调用
        if (message.isSelfCall()) {
            line.append(from).append(" -> ").append(to).append(" : ");
            line.append(message.getName());
            line.append("\n");
            return line.toString();
        }
        
        // 返回消息
        if (message.isReturn()) {
            line.append(from).append(" --> ").append(to).append(" : ");
            line.append(message.getName());
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
        
        line.append(message.getName());
        line.append("\n");
        
        return line.toString();
    }
    
    /**
     * 保存 DOT 到文件
     */
    public void saveToFile(UmlSequenceDiagram diagram, File outputFile) throws IOException {
        String dot = generateDot(diagram);
        
        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(dot);
        }
        
        log.info("UML 时序图已保存到: {}", outputFile.getAbsolutePath());
    }
}
