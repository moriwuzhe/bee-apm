package org.xi.lt.code.staticfilter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

/**
 * 静态分析过滤配置
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaticFilterConfig {

    /**
     * 包含的包（白名单），如果为空则不限制
     */
    @Builder.Default
    private Set<String> includePackages = new HashSet<>();

    /**
     * 排除的包（黑名单）
     */
    @Builder.Default
    private Set<String> excludePackages = new HashSet<>();

    /**
     * 包含的类（白名单）
     */
    @Builder.Default
    private Set<String> includeClasses = new HashSet<>();

    /**
     * 排除的类（黑名单）
     */
    @Builder.Default
    private Set<String> excludeClasses = new HashSet<>();

    /**
     * 包含的方法（白名单）
     */
    @Builder.Default
    private Set<String> includeMethods = new HashSet<>();

    /**
     * 排除的方法（黑名单）
     */
    @Builder.Default
    private Set<String> excludeMethods = new HashSet<>();

    /**
     * 包含的访问修饰符
     */
    @Builder.Default
    private Set<Modifier> includeModifiers = new HashSet<>();

    /**
     * 最大调用深度
     */
    @Builder.Default
    private int maxDepth = 5;

    /**
     * 是否过滤 JDK 相关
     */
    @Builder.Default
    private boolean excludeJdk = true;

    /**
     * 是否过滤日志相关
     */
    @Builder.Default
    private boolean excludeLogging = true;

    /**
     * 是否过滤 Setter/Getter
     */
    @Builder.Default
    private boolean excludeGetterSetter = true;

    /**
     * 是否过滤通用方法 (toString, equals, hashCode 等)
     */
    @Builder.Default
    private boolean excludeCommonMethods = true;

    /**
     * 是否过滤构造函数
     */
    @Builder.Default
    private boolean excludeConstructors = true;

    /**
     * 是否过滤 Builder 方法
     */
    @Builder.Default
    private boolean excludeBuilderMethods = true;

    /**
     * 是否过滤 Lombok 生成的方法
     */
    @Builder.Default
    private boolean excludeLombokMethods = true;

    /**
     * 是否过滤 LT 相关包和类
     */
    @Builder.Default
    private boolean excludeLt = true;

    /**
     * 是否过滤测试方法（test*, should*, when* 等）
     */
    @Builder.Default
    private boolean excludeTestMethods = false;

    /**
     * 是否过滤静态方法
     */
    @Builder.Default
    private boolean excludeStaticMethods = false;

    /**
     * 是否过滤私有方法
     */
    @Builder.Default
    private boolean excludePrivateMethods = false;

    /**
     * 是否过滤集合相关方法
     */
    @Builder.Default
    private boolean excludeCollectionMethods = false;

    /**
     * 是否过滤 String 相关方法
     */
    @Builder.Default
    private boolean excludeStringMethods = false;

    /**
     * 访问修饰符枚举
     */
    public enum Modifier {
        PUBLIC,
        PROTECTED,
        PRIVATE,
        DEFAULT
    }

    /**
     * 创建默认配置
     */
    public static StaticFilterConfig defaultConfig() {
        StaticFilterConfig config = new StaticFilterConfig();

        // 默认排除常见的 JDK 包
        config.excludePackages.addAll(DefaultFilters.JDK_PACKAGES);

        // 默认排除常见的第三方库
        config.excludePackages.addAll(DefaultFilters.THIRD_PARTY_PACKAGES);

        // 默认排除常见的 JDK 类
        config.excludeClasses.addAll(DefaultFilters.JDK_CLASSES);

        // 默认排除日志类
        config.excludeClasses.addAll(DefaultFilters.LOGGING_CLASSES);

        // 默认排除常见方法
        config.excludeMethods.addAll(DefaultFilters.COMMON_METHOD_NAMES);
        config.excludeMethods.addAll(DefaultFilters.LOGGING_METHOD_NAMES);

        // 默认只包含 public 和 protected 方法
        config.includeModifiers.add(Modifier.PUBLIC);
        config.includeModifiers.add(Modifier.PROTECTED);

        return config;
    }

    /**
     * 判断是否应该排除 LT 相关
     */
    private boolean shouldExcludeLt(String className) {
        if (!excludeLt || className == null) {
            return false;
        }
        for (String pkg : DefaultFilters.LT_PACKAGES) {
            if (className.startsWith(pkg)) {
                return true;
            }
        }
        return DefaultFilters.LT_CLASSES.contains(className) ||
               DefaultFilters.LT_CLASSES.contains(getSimpleClassName(className));
    }

    /**
     * 判断是否应该包含该类
     */
    public boolean shouldIncludeClass(String className) {
        if (className == null || className.isEmpty()) {
            return false;
        }

        // 1. 白名单优先
        if (!includeClasses.isEmpty()) {
            return includeClasses.contains(className) ||
                   includeClasses.contains(getSimpleClassName(className));
        }

        // 2. 检查是否排除 LT 相关
        if (shouldExcludeLt(className)) {
            return false;
        }

        // 3. 检查类黑名单
        String simpleName = getSimpleClassName(className);
        if (excludeClasses.contains(className) || excludeClasses.contains(simpleName)) {
            return false;
        }

        // 4. 检查包
        return shouldIncludePackage(className);
    }

    /**
     * 判断是否应该包含该包
     */
    public boolean shouldIncludePackage(String className) {
        if (className == null || className.isEmpty()) {
            return false;
        }

        // 1. 包白名单优先
        if (!includePackages.isEmpty()) {
            for (String pkg : includePackages) {
                if (className.startsWith(pkg)) {
                    return true;
                }
            }
            return false;
        }

        // 2. 检查包黑名单
        for (String pkg : excludePackages) {
            if (className.startsWith(pkg)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 判断是否应该包含该方法
     */
    public boolean shouldIncludeMethod(String methodName) {
        return shouldIncludeMethod(methodName, null);
    }

    /**
     * 判断是否应该包含该方法（支持构造函数检查）
     */
    public boolean shouldIncludeMethod(String methodName, String className) {
        if (methodName == null || methodName.isEmpty()) {
            return false;
        }

        // 1. 方法白名单优先
        if (!includeMethods.isEmpty()) {
            return includeMethods.contains(methodName);
        }

        // 2. 检查方法黑名单
        if (excludeMethods.contains(methodName)) {
            return false;
        }

        // 3. 检查构造函数
        if (excludeConstructors && className != null && DefaultFilters.isConstructor(methodName, className)) {
            return false;
        }

        // 4. 检查 Builder 方法
        if (excludeBuilderMethods && DefaultFilters.isBuilderMethod(methodName)) {
            return false;
        }

        // 5. 检查 Lombok 方法
        if (excludeLombokMethods && DefaultFilters.isLombokMethod(methodName)) {
            return false;
        }

        // 6. 检查 Setter/Getter
        if (excludeGetterSetter && isGetterSetter(methodName)) {
            return false;
        }

        // 7. 检查通用方法
        if (excludeCommonMethods && DefaultFilters.COMMON_OBJECT_METHODS.contains(methodName)) {
            return false;
        }

        // 8. 检查测试方法
        if (excludeTestMethods && DefaultFilters.isTestMethod(methodName)) {
            return false;
        }

        // 9. 检查集合方法
        if (excludeCollectionMethods && DefaultFilters.COLLECTION_METHOD_NAMES.contains(methodName)) {
            return false;
        }

        // 10. 检查 String 方法
        if (excludeStringMethods && DefaultFilters.STRING_METHOD_NAMES.contains(methodName)) {
            return false;
        }

        return true;
    }

    /**
     * 判断是否是 Setter/Getter
     */
    private boolean isGetterSetter(String methodName) {
        if (methodName.length() <= 2) {
            return false;
        }
        if (methodName.startsWith("get") && methodName.length() > 3
                && Character.isUpperCase(methodName.charAt(3))) {
            return true;
        }
        if (methodName.startsWith("set") && methodName.length() > 3
                && Character.isUpperCase(methodName.charAt(3))) {
            return true;
        }
        if (methodName.startsWith("is") && methodName.length() > 2
                && Character.isUpperCase(methodName.charAt(2))) {
            return true;
        }
        return false;
    }

    /**
     * 获取简单类名
     */
    private String getSimpleClassName(String className) {
        int lastDot = className.lastIndexOf('.');
        if (lastDot > 0) {
            return className.substring(lastDot + 1);
        }
        return className;
    }
}
