package org.xi.lt.code.staticmodel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 入口方法信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MethodEntry {

    /**
     * 完整方法 ID（className#methodName）
     */
    private String id;

    /**
     * 类名
     */
    private String className;

    /**
     * 简单类名
     */
    private String simpleClassName;

    /**
     * 方法名
     */
    private String methodName;

    /**
     * 方法签名
     */
    private String methodSignature;

    /**
     * 访问修饰符
     */
    private String accessModifier;

    /**
     * 是否是 public 方法
     */
    private boolean isPublic;

    /**
     * 是否是 main 方法
     */
    private boolean isMainMethod;

    /**
     * 是否是构造函数
     */
    private boolean isConstructor;

    /**
     * 描述（用于显示）
     */
    private String displayText;
}
