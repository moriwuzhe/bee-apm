package org.xi.lt.flow.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.type.Type;
import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.UmlClassDiagram;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UML 类图解析器
 * 专门解析 Java 代码，提取完整的类信息用于生成 UML 类图
 */
@Slf4j
public class UmlClassParser {
    
    private final JavaParser javaParser;
    
    public UmlClassParser() {
        this.javaParser = new JavaParser();
    }
    
    /**
     * 解析单个 Java 文件，生成 UML 类图
     */
    public UmlClassDiagram parseFile(File javaFile) throws FileNotFoundException {
        log.info("开始解析 UML 类图: {}", javaFile.getAbsolutePath());
        
        ParseResult<CompilationUnit> result = javaParser.parse(javaFile);
        if (!result.isSuccessful() || !result.getResult().isPresent()) {
            log.error("解析文件失败: {}", javaFile.getAbsolutePath());
            throw new RuntimeException("无法解析文件: " + javaFile.getAbsolutePath());
        }
        
        CompilationUnit cu = result.getResult().get();
        UmlClassDiagram diagram = UmlClassDiagram.builder()
                .name(javaFile.getName())
                .description("从文件 " + javaFile.getAbsolutePath() + " 生成的 UML 类图")
                .build();
        
        // 提取所有类和接口
        extractClassesAndInterfaces(cu, diagram);
        
        // 提取类之间的关系
        extractRelationships(cu, diagram);
        
        log.info("UML 类图解析完成！类数: {}, 关系数: {}", 
                diagram.getClasses().size(), diagram.getRelationships().size());
        return diagram;
    }
    
    /**
     * 提取所有类和接口
     */
    private void extractClassesAndInterfaces(CompilationUnit cu, UmlClassDiagram diagram) {
        // 处理类
        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            UmlClassDiagram.UmlClass umlClass = new UmlClassDiagram.UmlClass();
            
            // 设置类名
            String className = clazz.getFullyQualifiedName().isPresent() ? 
                    clazz.getFullyQualifiedName().get() : clazz.getNameAsString();
            umlClass.setClassName(className);
            umlClass.setSimpleName(clazz.getNameAsString());
            
            // 设置类类型
            if (clazz.isInterface()) {
                umlClass.setClassType(UmlClassDiagram.UmlClass.ClassType.INTERFACE);
            } else if (clazz.isAbstract()) {
                umlClass.setClassType(UmlClassDiagram.UmlClass.ClassType.ABSTRACT_CLASS);
            } else {
                umlClass.setClassType(UmlClassDiagram.UmlClass.ClassType.CLASS);
            }
            
            // 提取属性
            extractFields(clazz, umlClass);
            
            // 提取方法
            extractMethods(clazz, umlClass);
            
            // 提取继承关系
            extractInheritance(clazz, diagram, umlClass);
            
            diagram.addClass(umlClass);
        });
        
        // 处理枚举
        cu.findAll(EnumDeclaration.class).forEach(enumDecl -> {
            UmlClassDiagram.UmlClass umlClass = new UmlClassDiagram.UmlClass();
            umlClass.setClassName(enumDecl.getNameAsString());
            umlClass.setSimpleName(enumDecl.getNameAsString());
            umlClass.setClassType(UmlClassDiagram.UmlClass.ClassType.ENUM);
            diagram.addClass(umlClass);
        });
    }
    
    /**
     * 提取字段（属性）
     */
    private void extractFields(ClassOrInterfaceDeclaration clazz, UmlClassDiagram.UmlClass umlClass) {
        clazz.getFields().forEach(field -> {
            field.getVariables().forEach(variable -> {
                UmlClassDiagram.UmlAttribute attribute = new UmlClassDiagram.UmlAttribute();
                
                // 设置可见性
                attribute.setVisibility(getVisibility(field));
                
                // 设置属性名和类型
                attribute.setName(variable.getNameAsString());
                attribute.setType(variable.getTypeAsString());
                
                // 设置是否静态
                attribute.setStatic(field.isStatic());
                
                umlClass.addAttribute(attribute);
            });
        });
    }
    
    /**
     * 提取方法
     */
    private void extractMethods(ClassOrInterfaceDeclaration clazz, UmlClassDiagram.UmlClass umlClass) {
        clazz.getMethods().forEach(method -> {
            UmlClassDiagram.UmlMethod umlMethod = new UmlClassDiagram.UmlMethod();
            
            // 设置可见性
            umlMethod.setVisibility(getVisibility(method));
            
            // 设置方法名
            umlMethod.setName(method.getNameAsString());
            
            // 设置返回类型
            umlMethod.setReturnType(method.getTypeAsString());
            
            // 设置是否静态和抽象
            umlMethod.setStatic(method.isStatic());
            umlMethod.setAbstract(method.isAbstract());
            
            // 提取参数
            method.getParameters().forEach(param -> {
                UmlClassDiagram.UmlParameter parameter = new UmlClassDiagram.UmlParameter();
                parameter.setName(param.getNameAsString());
                parameter.setType(param.getTypeAsString());
                umlMethod.addParameter(parameter);
            });
            
            umlClass.addMethod(umlMethod);
        });
    }
    
    /**
     * 提取继承关系
     */
    private void extractInheritance(ClassOrInterfaceDeclaration clazz, 
                                       UmlClassDiagram diagram, 
                                       UmlClassDiagram.UmlClass umlClass) {
        // 提取 extends 关系（继承）
        clazz.getExtendedTypes().forEach(extendedType -> {
            String targetClassName = extendedType.getNameAsString();
            UmlClassDiagram.UmlRelationship relationship = new UmlClassDiagram.UmlRelationship();
            relationship.setSourceClassName(umlClass.getClassName());
            relationship.setTargetClassName(targetClassName);
            relationship.setType(UmlClassDiagram.UmlRelationship.RelationshipType.INHERITANCE);
            diagram.addRelationship(relationship);
        });
        
        // 提取 implements 关系（实现）
        clazz.getImplementedTypes().forEach(implementedType -> {
            String targetClassName = implementedType.getNameAsString();
            UmlClassDiagram.UmlRelationship relationship = new UmlClassDiagram.UmlRelationship();
            relationship.setSourceClassName(umlClass.getClassName());
            relationship.setTargetClassName(targetClassName);
            relationship.setType(UmlClassDiagram.UmlRelationship.RelationshipType.REALIZATION);
            diagram.addRelationship(relationship);
        });
    }
    
    /**
     * 提取类之间的关系
     */
    private void extractRelationships(CompilationUnit cu, UmlClassDiagram diagram) {
        // 简单的依赖关系提取（基于字段类型和方法参数/返回类型）
        // 更复杂的关联、聚合、组合关系需要更深入的分析
    }
    
    /**
     * 获取可见性
     */
    private UmlClassDiagram.UmlAttribute.Visibility getVisibility(BodyDeclaration<?> declaration) {
        if (declaration instanceof FieldDeclaration) {
            FieldDeclaration field = (FieldDeclaration) declaration;
            if (field.isPublic()) return UmlClassDiagram.UmlAttribute.Visibility.PUBLIC;
            if (field.isPrivate()) return UmlClassDiagram.UmlAttribute.Visibility.PRIVATE;
            if (field.isProtected()) return UmlClassDiagram.UmlAttribute.Visibility.PROTECTED;
        } else if (declaration instanceof MethodDeclaration) {
            MethodDeclaration method = (MethodDeclaration) declaration;
            if (method.isPublic()) return UmlClassDiagram.UmlAttribute.Visibility.PUBLIC;
            if (method.isPrivate()) return UmlClassDiagram.UmlAttribute.Visibility.PRIVATE;
            if (method.isProtected()) return UmlClassDiagram.UmlAttribute.Visibility.PROTECTED;
        }
        return UmlClassDiagram.UmlAttribute.Visibility.PACKAGE;
    }
}
