package org.xi.lt.flow.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UML 类图
 * 完整的 UML 类图数据模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UmlClassDiagram {
    
    /**
     * 图的名称
     */
    private String name;
    
    /**
     * 图的描述
     */
    private String description;
    
    /**
     * 所有类节点
     */
    @Builder.Default
    private List<UmlClass> classes = new ArrayList<>();
    
    /**
     * 所有关系
     */
    @Builder.Default
    private List<UmlRelationship> relationships = new ArrayList<>();
    
    /**
     * 添加类
     */
    public void addClass(UmlClass clazz) {
        if (classes == null) {
            classes = new ArrayList<>();
        }
        classes.add(clazz);
    }
    
    /**
     * 添加关系
     */
    public void addRelationship(UmlRelationship relationship) {
        if (relationships == null) {
            relationships = new ArrayList<>();
        }
        relationships.add(relationship);
    }
    
    /**
     * 通过类名获取类
     */
    public UmlClass getClassByName(String className) {
        if (classes == null) {
            return null;
        }
        return classes.stream()
                .filter(c -> c.getClassName().equals(className))
                .findFirst()
                .orElse(null);
    }
    
    /**
     * UML 类节点
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UmlClass {
        
        /**
         * 类名（全限定名）
         */
        private String className;
        
        /**
         * 简单类名
         */
        private String simpleName;
        
        /**
         * 类类型：CLASS, INTERFACE, ABSTRACT_CLASS, ENUM
         */
        private ClassType classType;
        
        /**
         * 属性列表
         */
        @Builder.Default
        private List<UmlAttribute> attributes = new ArrayList<>();
        
        /**
         * 方法列表
         */
        @Builder.Default
        private List<UmlMethod> methods = new ArrayList<>();
        
        /**
         * 添加属性
         */
        public void addAttribute(UmlAttribute attribute) {
            if (attributes == null) {
                attributes = new ArrayList<>();
            }
            attributes.add(attribute);
        }
        
        /**
         * 添加方法
         */
        public void addMethod(UmlMethod method) {
            if (methods == null) {
                methods = new ArrayList<>();
            }
            methods.add(method);
        }
        
        /**
         * 类类型枚举
         */
        public enum ClassType {
            CLASS,
            INTERFACE,
            ABSTRACT_CLASS,
            ENUM
        }
    }
    
    /**
     * UML 属性
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UmlAttribute {
        
        /**
         * 可见性：PUBLIC(+), PRIVATE(-), PROTECTED(#), PACKAGE(~)
         */
        private Visibility visibility;
        
        /**
         * 属性名
         */
        private String name;
        
        /**
         * 属性类型
         */
        private String type;
        
        /**
         * 是否是静态属性
         */
        @Builder.Default
        private boolean isStatic = false;
        
        /**
         * 可见性枚举
         */
        public enum Visibility {
            PUBLIC("+"),
            PRIVATE("-"),
            PROTECTED("#"),
            PACKAGE("~");
            
            private final String symbol;
            
            Visibility(String symbol) {
                this.symbol = symbol;
            }
            
            public String getSymbol() {
                return symbol;
            }
        }
    }
    
    /**
     * UML 方法
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UmlMethod {
        
        /**
         * 可见性：PUBLIC(+), PRIVATE(-), PROTECTED(#), PACKAGE(~)
         */
        private UmlAttribute.Visibility visibility;
        
        /**
         * 方法名
         */
        private String name;
        
        /**
         * 返回类型
         */
        private String returnType;
        
        /**
         * 参数列表
         */
        @Builder.Default
        private List<UmlParameter> parameters = new ArrayList<>();
        
        /**
         * 是否是静态方法
         */
        @Builder.Default
        private boolean isStatic = false;
        
        /**
         * 是否是抽象方法
         */
        @Builder.Default
        private boolean isAbstract = false;
        
        /**
         * 添加参数
         */
        public void addParameter(UmlParameter parameter) {
            if (parameters == null) {
                parameters = new ArrayList<>();
            }
            parameters.add(parameter);
        }
    }
    
    /**
     * UML 方法参数
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UmlParameter {
        
        /**
         * 参数名
         */
        private String name;
        
        /**
         * 参数类型
         */
        private String type;
    }
    
    /**
     * UML 关系
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UmlRelationship {
        
        /**
         * 源类名
         */
        private String sourceClassName;
        
        /**
         * 目标类名
         */
        private String targetClassName;
        
        /**
         * 关系类型
         */
        private RelationshipType type;
        
        /**
         * 关系标签
         */
        private String label;
        
        /**
         * 源端多重性
         */
        private String sourceMultiplicity;
        
        /**
         * 目标端多重性
         */
        private String targetMultiplicity;
        
        /**
         * 关系类型枚举
         */
        public enum RelationshipType {
            /**
             * 继承（Generalization）
             */
            INHERITANCE,
            
            /**
             * 实现（Realization）
             */
            REALIZATION,
            
            /**
             * 关联（Association）
             */
            ASSOCIATION,
            
            /**
             * 聚合（Aggregation）
             */
            AGGREGATION,
            
            /**
             * 组合（Composition）
             */
            COMPOSITION,
            
            /**
             * 依赖（Dependency）
             */
            DEPENDENCY
        }
    }
}
