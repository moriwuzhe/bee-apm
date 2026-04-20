package org.xi.lt.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * UML 时序图
 * 展示对象之间的交互和时间序列
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UmlSequenceDiagram {
    
    /**
     * 图的名称
     */
    private String name;
    
    /**
     * 图的描述
     */
    private String description;
    
    /**
     * 所有参与者（对象/类）
     */
    @Builder.Default
    private List<Participant> participants = new ArrayList<>();
    
    /**
     * 所有消息
     */
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
    
    /**
     * 添加参与者
     */
    public void addParticipant(Participant participant) {
        if (participants == null) {
            participants = new ArrayList<>();
        }
        participants.add(participant);
    }
    
    /**
     * 添加消息
     */
    public void addMessage(Message message) {
        if (messages == null) {
            messages = new ArrayList<>();
        }
        messages.add(message);
    }
    
    /**
     * 参与者（对象/类）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Participant {
        
        /**
         * 参与者ID
         */
        private String id;
        
        /**
         * 参与者名称
         */
        private String name;
        
        /**
         * 参与者类型
         */
        private ParticipantType type;
        
        /**
         * 参与者类型枚举
         */
        public enum ParticipantType {
            OBJECT,
            ACTOR,
            BOUNDARY,
            CONTROL,
            ENTITY
        }
    }
    
    /**
     * 消息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        
        /**
         * 消息序号
         */
        private int sequence;
        
        /**
         * 发送者参与者ID
         */
        private String fromParticipantId;
        
        /**
         * 接收者参与者ID
         */
        private String toParticipantId;
        
        /**
         * 消息名称/描述
         */
        private String name;
        
        /**
         * 消息类型
         */
        private MessageType type;
        
        /**
         * 是否是自调用
         */
        @Builder.Default
        private boolean isSelfCall = false;
        
        /**
         * 是否是返回消息
         */
        @Builder.Default
        private boolean isReturn = false;
        
        /**
         * 消息类型枚举
         */
        public enum MessageType {
            SYNCHRONOUS,  // 同步调用（实线箭头）
            ASYNCHRONOUS, // 异步调用（虚线箭头）
            RETURN,       // 返回消息（虚线开放箭头）
            CREATE,       // 创建对象
            DESTROY       // 销毁对象
        }
    }
}
