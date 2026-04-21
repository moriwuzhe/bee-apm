package org.xi.lt.flow.staticfilter;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 默认过滤器配置
 */
public class DefaultFilters {

    private DefaultFilters() {}

    /**
     * JDK 包前缀
     */
    public static final Set<String> JDK_PACKAGES = new HashSet<>(Arrays.asList(
            "java.", "javax.", "jdk.", "sun.", "com.sun.",
            "org.w3c.", "org.xml.", "org.omg.", "javafx."
    ));

    /**
     * 第三方库包前缀
     */
    public static final Set<String> THIRD_PARTY_PACKAGES = new HashSet<>(Arrays.asList(
            // 日志框架
            "org.slf4j.", "org.apache.log4j.", "org.apache.logging.log4j.",
            "ch.qos.logback.", "org.apache.commons.logging.",
            // JSON 处理
            "com.fasterxml.jackson.", "com.google.gson.", "org.json.",
            "com.alibaba.fastjson.", "com.alibaba.fastjson2.",
            // HTTP 客户端
            "org.apache.http.", "okhttp3.", "retrofit2.",
            // 数据库/ORM
            "org.hibernate.", "javax.persistence.", "jakarta.persistence.",
            "org.mybatis.", "com.baomidou.mybatisplus.",
            // Spring 框架
            "org.springframework.", "org.springframework.boot.",
            // 工具库
            "org.apache.commons.", "com.google.common.", "cn.hutool.",
            // 测试框架
            "org.junit.", "org.testng.", "org.mockito.",
            // 其他
            "lombok.", "io.netty.", "org.yaml."
    ));

    /**
     * LT 相关包前缀
     */
    public static final Set<String> LT_PACKAGES = new HashSet<>(Arrays.asList(
            "org.xi.lt.", "com.lt.", "lt."
    ));

    /**
     * LT 相关类名
     */
    public static final Set<String> LT_CLASSES = new HashSet<>(Arrays.asList(
            // 可以根据需要添加具体的 LT 类名
    ));

    /**
     * JDK 常用类名
     */
    public static final Set<String> JDK_CLASSES = new HashSet<>(Arrays.asList(
            "String", "Integer", "Long", "Double", "Float", "Boolean",
            "Short", "Byte", "Character", "Void", "BigDecimal", "BigInteger",
            "List", "Map", "Set", "Collection", "ArrayList", "HashMap",
            "HashSet", "LinkedList", "TreeMap", "TreeSet", "Optional",
            "Stream", "Collectors", "Arrays", "Collections", "Objects",
            "Math", "System", "Class", "Object", "Thread", "Runnable",
            "Exception", "RuntimeException", "Throwable", "Error",
            "PrintStream", "PrintWriter", "StringBuilder", "StringBuffer",
            "Date", "Calendar", "LocalDate", "LocalTime", "LocalDateTime",
            "Instant", "Duration", "Period", "ZoneId", "ChronoUnit",
            "File", "Path", "Files", "Paths", "InputStream", "OutputStream",
            "Reader", "Writer", "BufferedReader", "BufferedWriter",
            "Scanner", "Formatter", "Locale", "ResourceBundle", "Properties",
            "TimeUnit", "AtomicInteger", "AtomicLong", "AtomicReference",
            "CountDownLatch", "CyclicBarrier", "Semaphore", "Executor",
            "ExecutorService", "ThreadPoolExecutor", "Future", "CompletableFuture",
            "Callable", "Supplier", "Consumer", "Function", "Predicate",
            "BiFunction", "BiConsumer", "BiPredicate", "UnaryOperator",
            "BinaryOperator", "Comparator", "Iterable", "Iterator",
            "ListIterator", "Enumeration", "Spliterator"
    ));

    /**
     * 日志类名
     */
    public static final Set<String> LOGGING_CLASSES = new HashSet<>(Arrays.asList(
            "Logger", "Log", "LoggerFactory", "LogManager",
            "Log4jLogger", "Slf4jLogger", "JulLogger",
            "LogbackLogger", "CommonsLogger"
    ));

    /**
     * Object 类的通用方法
     */
    public static final Set<String> COMMON_OBJECT_METHODS = new HashSet<>(Arrays.asList(
            "toString", "equals", "hashCode", "clone", "wait", "notify",
            "notifyAll", "finalize", "getClass"
    ));

    /**
     * 通用方法名
     */
    public static final Set<String> COMMON_METHOD_NAMES = new HashSet<>(Arrays.asList(
            // String/StringBuilder/StringBuffer 方法
            "append", "insert", "delete", "deleteCharAt", "replace", "substring",
            "subSequence", "concat", "trim", "strip", "stripLeading", "stripTrailing",
            "toLowerCase", "toUpperCase", "charAt", "length", "isEmpty", "isBlank",
            "compareTo", "compareToIgnoreCase", "contentEquals", "startsWith",
            "endsWith", "indexOf", "lastIndexOf", "contains", "matches", "split",
            "join", "repeat", "valueOf", "copyValueOf", "intern",

            // 集合方法
            "add", "addAll", "remove", "removeAll", "retainAll", "clear", "contains",
            "containsAll", "size", "isEmpty", "iterator", "listIterator", "spliterator",
            "toArray", "stream", "parallelStream", "forEach", "get", "set", "indexOf",
            "lastIndexOf", "listIterator", "subList", "put", "putAll", "remove",
            "get", "containsKey", "containsValue", "keySet", "values", "entrySet",
            "isEmpty", "size", "clear", "replace", "replaceAll", "merge", "compute",
            "computeIfAbsent", "computeIfPresent", "getOrDefault", "putIfAbsent",
            "element", "peek", "poll", "offer",

            // Stream 方法
            "filter", "map", "mapToInt", "mapToLong", "mapToDouble", "flatMap",
            "distinct", "sorted", "peek", "limit", "skip", "takeWhile", "dropWhile",
            "forEach", "forEachOrdered", "toArray", "reduce", "collect", "min", "max",
            "count", "anyMatch", "allMatch", "noneMatch", "findFirst", "findAny",
            "of", "ofNullable", "empty", "concat", "iterate", "generate", "range",
            "rangeClosed",

            // Optional 方法
            "get", "isPresent", "isEmpty", "ifPresent", "ifPresentOrElse", "orElse",
            "orElseGet", "orElseThrow", "filter", "map", "flatMap", "stream",

            // IO 流方法
            "read", "write", "close", "flush", "available", "mark", "reset",
            "markSupported", "skip", "transferTo", "readLine", "print", "println",
            "printf", "format"
    ));

    /**
     * 日志方法名
     */
    public static final Set<String> LOGGING_METHOD_NAMES = new HashSet<>(Arrays.asList(
            "trace", "debug", "info", "warn", "error", "fatal",
            "log", "isTraceEnabled", "isDebugEnabled", "isInfoEnabled",
            "isWarnEnabled", "isErrorEnabled", "isFatalEnabled",
            "entry", "exit", "throwing", "catching"
    ));

    /**
     * 判断是否是构造函数
     */
    public static boolean isConstructor(String methodName, String className) {
        if (methodName == null || className == null) {
            return false;
        }
        // 构造函数名与类名相同
        String simpleClassName = className;
        int lastDot = className.lastIndexOf('.');
        if (lastDot > 0) {
            simpleClassName = className.substring(lastDot + 1);
        }
        return methodName.equals(simpleClassName);
    }

    /**
     * 判断是否是 Builder 方法
     */
    public static boolean isBuilderMethod(String methodName) {
        if (methodName == null || methodName.length() < 3) {
            return false;
        }
        String lowerName = methodName.toLowerCase();
        // 常见的 builder 方法前缀
        return lowerName.startsWith("build") ||
               lowerName.startsWith("tobuilder") ||
               lowerName.equals("builder") ||
               lowerName.startsWith("create") ||
               lowerName.startsWith("new") ||
               lowerName.startsWith("init") ||
               lowerName.startsWith("initialize");
    }

    /**
     * 判断是否是 Lombok 生成的方法
     */
    public static boolean isLombokMethod(String methodName) {
        if (methodName == null) {
            return false;
        }
        // Lombok 生成的方法模式
        return methodName.equals("equals") ||
               methodName.equals("hashCode") ||
               methodName.equals("toString") ||
               methodName.equals("canEqual") ||
               methodName.startsWith("with");
    }
}
