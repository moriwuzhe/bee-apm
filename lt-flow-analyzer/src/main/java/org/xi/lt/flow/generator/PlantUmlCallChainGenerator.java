package org.xi.lt.flow.generator;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;
import org.xi.lt.flow.theme.ChartTheme;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

/**
 * PlantUML 方法调用链生成器
 * 将方法调用链数据模型转换为 PlantUML 格式
 */
@Slf4j
public class PlantUmlCallChainGenerator {

    /**
     * 图表样式类型
     */
    public enum DiagramStyle {
        ACTIVITY,       // 活动图
        FLOWCHART,      // 流程图 (同活动图)
        SEQUENCE,       // 时序图
        COMPONENT,      // 组件图
        C4,             // C4模型 (同组件图)
        STATE,          // 状态图
        MINDMAP,        // 思维导图
        OBJECT,         // 对象图
        DEPLOYMENT,     // 部署图
        USECASE,        // 用例图
        TIMING,         // 定时图
        GANTT,          // 甘特图
        WBS,            // 工作分解结构图
        WORKFLOW        // 工作流 (同活动图)
    }

    /**
     * 需要过滤的JDK类名前缀
     */
    private static final Set<String> JDK_PACKAGES = new HashSet<>(Arrays.asList(
            "java.", "javax.", "jdk.", "sun.", "com.sun.",
            "org.w3c.", "org.xml.", "org.omg.", "javafx."
    ));

    /**
     * 需要过滤的JDK类名
     */
    private static final Set<String> JDK_CLASSES = new HashSet<>(Arrays.asList(
            "String", "Integer", "Long", "Double", "Float", "Boolean",
            "Short", "Byte", "Character", "BigDecimal", "BigInteger",
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
            "ListIterator", "Enumeration", "Spliterator", "Comparator"
    ));

    /**
     * 方法名中文翻译映射
     */
    private static final Map<String, String> METHOD_TRANSLATIONS = new HashMap<>();

    static {
        // 基础操作
        METHOD_TRANSLATIONS.put("get", "获取");
        METHOD_TRANSLATIONS.put("set", "设置");
        METHOD_TRANSLATIONS.put("is", "判断是否");
        METHOD_TRANSLATIONS.put("has", "是否有");
        METHOD_TRANSLATIONS.put("add", "添加");
        METHOD_TRANSLATIONS.put("remove", "删除");
        METHOD_TRANSLATIONS.put("delete", "删除");
        METHOD_TRANSLATIONS.put("update", "更新");
        METHOD_TRANSLATIONS.put("modify", "修改");
        METHOD_TRANSLATIONS.put("edit", "编辑");
        METHOD_TRANSLATIONS.put("insert", "插入");
        METHOD_TRANSLATIONS.put("clear", "清空");
        METHOD_TRANSLATIONS.put("reset", "重置");

        // 查询和搜索
        METHOD_TRANSLATIONS.put("find", "查找");
        METHOD_TRANSLATIONS.put("search", "搜索");
        METHOD_TRANSLATIONS.put("query", "查询");
        METHOD_TRANSLATIONS.put("select", "选择");
        METHOD_TRANSLATIONS.put("fetch", "获取");
        METHOD_TRANSLATIONS.put("retrieve", "检索");
        METHOD_TRANSLATIONS.put("lookup", "查询");
        METHOD_TRANSLATIONS.put("load", "加载");
        METHOD_TRANSLATIONS.put("read", "读取");

        // 保存和持久化
        METHOD_TRANSLATIONS.put("save", "保存");
        METHOD_TRANSLATIONS.put("store", "存储");
        METHOD_TRANSLATIONS.put("persist", "持久化");
        METHOD_TRANSLATIONS.put("write", "写入");
        METHOD_TRANSLATIONS.put("flush", "刷新");
        METHOD_TRANSLATIONS.put("commit", "提交");
        METHOD_TRANSLATIONS.put("rollback", "回滚");

        // 创建和销毁
        METHOD_TRANSLATIONS.put("create", "创建");
        METHOD_TRANSLATIONS.put("new", "新建");
        METHOD_TRANSLATIONS.put("init", "初始化");
        METHOD_TRANSLATIONS.put("initialize", "初始化");
        METHOD_TRANSLATIONS.put("destroy", "销毁");
        METHOD_TRANSLATIONS.put("dispose", "释放");
        METHOD_TRANSLATIONS.put("close", "关闭");
        METHOD_TRANSLATIONS.put("open", "打开");
        METHOD_TRANSLATIONS.put("shutdown", "关闭");

        // 启动和停止
        METHOD_TRANSLATIONS.put("start", "开始");
        METHOD_TRANSLATIONS.put("stop", "停止");
        METHOD_TRANSLATIONS.put("begin", "开始");
        METHOD_TRANSLATIONS.put("end", "结束");
        METHOD_TRANSLATIONS.put("pause", "暂停");
        METHOD_TRANSLATIONS.put("resume", "继续");
        METHOD_TRANSLATIONS.put("restart", "重启");
        METHOD_TRANSLATIONS.put("run", "运行");
        METHOD_TRANSLATIONS.put("execute", "执行");
        METHOD_TRANSLATIONS.put("invoke", "调用");
        METHOD_TRANSLATIONS.put("call", "调用");

        // 处理和转换
        METHOD_TRANSLATIONS.put("process", "处理");
        METHOD_TRANSLATIONS.put("handle", "处理");
        METHOD_TRANSLATIONS.put("doFilter", "执行过滤");
        METHOD_TRANSLATIONS.put("filter", "过滤");
        METHOD_TRANSLATIONS.put("transform", "转换");
        METHOD_TRANSLATIONS.put("convert", "转换");
        METHOD_TRANSLATIONS.put("parse", "解析");
        METHOD_TRANSLATIONS.put("decode", "解码");
        METHOD_TRANSLATIONS.put("encode", "编码");
        METHOD_TRANSLATIONS.put("format", "格式化");
        METHOD_TRANSLATIONS.put("normalize", "标准化");
        METHOD_TRANSLATIONS.put("validate", "验证");
        METHOD_TRANSLATIONS.put("check", "检查");
        METHOD_TRANSLATIONS.put("verify", "校验");

        // 构建和生成
        METHOD_TRANSLATIONS.put("build", "构建");
        METHOD_TRANSLATIONS.put("generate", "生成");
        METHOD_TRANSLATIONS.put("create", "创建");
        METHOD_TRANSLATIONS.put("make", "制作");
        METHOD_TRANSLATIONS.put("compile", "编译");
        METHOD_TRANSLATIONS.put("assemble", "组装");
        METHOD_TRANSLATIONS.put("prepare", "准备");

        // 计算和判断
        METHOD_TRANSLATIONS.put("calculate", "计算");
        METHOD_TRANSLATIONS.put("compute", "计算");
        METHOD_TRANSLATIONS.put("evaluate", "评估");
        METHOD_TRANSLATIONS.put("compare", "比较");
        METHOD_TRANSLATIONS.put("equals", "比较相等");
        METHOD_TRANSLATIONS.put("hashCode", "哈希码");
        METHOD_TRANSLATIONS.put("toString", "转字符串");
        METHOD_TRANSLATIONS.put("clone", "克隆");
        METHOD_TRANSLATIONS.put("copy", "复制");
        METHOD_TRANSLATIONS.put("duplicate", "复制");
        METHOD_TRANSLATIONS.put("merge", "合并");
        METHOD_TRANSLATIONS.put("split", "拆分");

        // 集合操作
        METHOD_TRANSLATIONS.put("contains", "包含");
        METHOD_TRANSLATIONS.put("size", "大小");
        METHOD_TRANSLATIONS.put("isEmpty", "是否为空");
        METHOD_TRANSLATIONS.put("iterator", "迭代器");
        METHOD_TRANSLATIONS.put("toArray", "转数组");
        METHOD_TRANSLATIONS.put("keySet", "键集合");
        METHOD_TRANSLATIONS.put("values", "值集合");
        METHOD_TRANSLATIONS.put("entrySet", "条目集合");
        METHOD_TRANSLATIONS.put("put", "放入");
        METHOD_TRANSLATIONS.put("get", "获取");
        METHOD_TRANSLATIONS.put("remove", "删除");

        // 网络和IO
        METHOD_TRANSLATIONS.put("connect", "连接");
        METHOD_TRANSLATIONS.put("disconnect", "断开连接");
        METHOD_TRANSLATIONS.put("send", "发送");
        METHOD_TRANSLATIONS.put("receive", "接收");
        METHOD_TRANSLATIONS.put("request", "请求");
        METHOD_TRANSLATIONS.put("response", "响应");
        METHOD_TRANSLATIONS.put("flush", "刷新");
        METHOD_TRANSLATIONS.put("transfer", "传输");
        METHOD_TRANSLATIONS.put("download", "下载");
        METHOD_TRANSLATIONS.put("upload", "上传");

        // 日志和输出
        METHOD_TRANSLATIONS.put("log", "记录日志");
        METHOD_TRANSLATIONS.put("debug", "调试");
        METHOD_TRANSLATIONS.put("info", "信息");
        METHOD_TRANSLATIONS.put("warn", "警告");
        METHOD_TRANSLATIONS.put("error", "错误");
        METHOD_TRANSLATIONS.put("trace", "追踪");
        METHOD_TRANSLATIONS.put("print", "打印");
        METHOD_TRANSLATIONS.put("println", "打印行");
        METHOD_TRANSLATIONS.put("printf", "格式化打印");

        // Web相关
        METHOD_TRANSLATIONS.put("doGet", "处理GET请求");
        METHOD_TRANSLATIONS.put("doPost", "处理POST请求");
        METHOD_TRANSLATIONS.put("doPut", "处理PUT请求");
        METHOD_TRANSLATIONS.put("doDelete", "处理DELETE请求");
        METHOD_TRANSLATIONS.put("service", "服务处理");
        METHOD_TRANSLATIONS.put("init", "初始化");
        METHOD_TRANSLATIONS.put("destroy", "销毁");
        METHOD_TRANSLATIONS.put("getServletConfig", "获取Servlet配置");
        METHOD_TRANSLATIONS.put("getServletInfo", "获取Servlet信息");

        // 数据库相关
        METHOD_TRANSLATIONS.put("connect", "连接数据库");
        METHOD_TRANSLATIONS.put("disconnect", "断开数据库");
        METHOD_TRANSLATIONS.put("query", "查询");
        METHOD_TRANSLATIONS.put("execute", "执行");
        METHOD_TRANSLATIONS.put("executeQuery", "执行查询");
        METHOD_TRANSLATIONS.put("executeUpdate", "执行更新");
        METHOD_TRANSLATIONS.put("commit", "提交事务");
        METHOD_TRANSLATIONS.put("rollback", "回滚事务");
        METHOD_TRANSLATIONS.put("prepareStatement", "准备语句");
        METHOD_TRANSLATIONS.put("setParameter", "设置参数");
        METHOD_TRANSLATIONS.put("getResultSet", "获取结果集");
        METHOD_TRANSLATIONS.put("next", "下一行");
        METHOD_TRANSLATIONS.put("close", "关闭");

        // 其他常见
        METHOD_TRANSLATIONS.put("main", "主方法");
        METHOD_TRANSLATIONS.put("test", "测试");
        METHOD_TRANSLATIONS.put("before", "前置");
        METHOD_TRANSLATIONS.put("after", "后置");
        METHOD_TRANSLATIONS.put("beforeClass", "类前置");
        METHOD_TRANSLATIONS.put("afterClass", "类后置");
        METHOD_TRANSLATIONS.put("accept", "接受");
        METHOD_TRANSLATIONS.put("apply", "应用");
        METHOD_TRANSLATIONS.put("andThen", "然后");
        METHOD_TRANSLATIONS.put("compose", "组合");
        METHOD_TRANSLATIONS.put("orElse", "否则");
        METHOD_TRANSLATIONS.put("orElseGet", "否则获取");
        METHOD_TRANSLATIONS.put("orElseThrow", "否则抛出");
        METHOD_TRANSLATIONS.put("ifPresent", "如果存在");
        METHOD_TRANSLATIONS.put("map", "映射");
        METHOD_TRANSLATIONS.put("flatMap", "扁平映射");
        METHOD_TRANSLATIONS.put("filter", "过滤");
        METHOD_TRANSLATIONS.put("reduce", "归约");
        METHOD_TRANSLATIONS.put("collect", "收集");
        METHOD_TRANSLATIONS.put("forEach", "遍历");
        METHOD_TRANSLATIONS.put("peek", "查看");
        METHOD_TRANSLATIONS.put("limit", "限制");
        METHOD_TRANSLATIONS.put("skip", "跳过");
        METHOD_TRANSLATIONS.put("sorted", "排序");
        METHOD_TRANSLATIONS.put("distinct", "去重");
        METHOD_TRANSLATIONS.put("count", "计数");
        METHOD_TRANSLATIONS.put("sum", "求和");
        METHOD_TRANSLATIONS.put("average", "平均值");
        METHOD_TRANSLATIONS.put("min", "最小值");
        METHOD_TRANSLATIONS.put("max", "最大值");
        METHOD_TRANSLATIONS.put("anyMatch", "任意匹配");
        METHOD_TRANSLATIONS.put("allMatch", "全部匹配");
        METHOD_TRANSLATIONS.put("noneMatch", "无匹配");
        METHOD_TRANSLATIONS.put("findFirst", "查找第一个");
        METHOD_TRANSLATIONS.put("findAny", "查找任意");
        METHOD_TRANSLATIONS.put("of", "创建");
        METHOD_TRANSLATIONS.put("ofNullable", "创建可空");
        METHOD_TRANSLATIONS.put("empty", "空");
        METHOD_TRANSLATIONS.put("range", "范围");
        METHOD_TRANSLATIONS.put("rangeClosed", "闭范围");
        METHOD_TRANSLATIONS.put("iterate", "迭代");
        METHOD_TRANSLATIONS.put("generate", "生成");
        METHOD_TRANSLATIONS.put("concat", "连接");
        METHOD_TRANSLATIONS.put("toList", "转列表");
        METHOD_TRANSLATIONS.put("toSet", "转集合");
        METHOD_TRANSLATIONS.put("toMap", "转映射");
        METHOD_TRANSLATIONS.put("joining", "连接");
        METHOD_TRANSLATIONS.put("counting", "计数");
        METHOD_TRANSLATIONS.put("summingInt", "整数求和");
        METHOD_TRANSLATIONS.put("summingLong", "长整型求和");
        METHOD_TRANSLATIONS.put("summingDouble", "双精度求和");
        METHOD_TRANSLATIONS.put("averagingInt", "整数平均");
        METHOD_TRANSLATIONS.put("averagingLong", "长整型平均");
        METHOD_TRANSLATIONS.put("averagingDouble", "双精度平均");
        METHOD_TRANSLATIONS.put("summarizingInt", "整数统计");
        METHOD_TRANSLATIONS.put("summarizingLong", "长整型统计");
        METHOD_TRANSLATIONS.put("summarizingDouble", "双精度统计");
        METHOD_TRANSLATIONS.put("minBy", "最小");
        METHOD_TRANSLATIONS.put("maxBy", "最大");
        METHOD_TRANSLATIONS.put("groupingBy", "分组");
        METHOD_TRANSLATIONS.put("partitioningBy", "分区");
        METHOD_TRANSLATIONS.put("mapping", "映射");
        METHOD_TRANSLATIONS.put("collectingAndThen", "收集然后");
        METHOD_TRANSLATIONS.put("teeing", "合并");
        METHOD_TRANSLATIONS.put("toUnmodifiableList", "转不可变列表");
        METHOD_TRANSLATIONS.put("toUnmodifiableSet", "转不可变集合");
        METHOD_TRANSLATIONS.put("toUnmodifiableMap", "转不可变映射");
    }

    /**
     * 生成 PlantUML 格式的方法调用链（使用活动图样式）
     */
    public String generatePlantUml(FlowGraph graph) {
        return generatePlantUml(graph, DiagramStyle.ACTIVITY);
    }

    /**
     * 生成指定样式的 PlantUML 格式的方法调用链
     */
    public String generatePlantUml(FlowGraph graph, DiagramStyle style) {
        return generatePlantUml(graph, style, ChartTheme.defaultTheme());
    }

    /**
     * 过滤FlowGraph，移除任何包含 "->" 的节点和边，以及其他应该过滤的节点
     */
    private FlowGraph filterGraph(FlowGraph graph) {
        FlowGraph filtered = FlowGraph.builder()
                .name(graph.getName())
                .description(graph.getDescription())
                .build();

        Map<String, FlowNode> validNodes = new HashMap<>();

        // 先添加所有有效节点
        for (FlowNode node : graph.getAllNodes()) {
            if (!hasArrowInAnyField(node) && !shouldFilterNode(node)) {
                validNodes.put(node.getId(), node);
                filtered.addNode(node);
            }
        }

        // 再添加所有有效边（两个节点都必须有效）
        for (FlowEdge edge : graph.getEdges()) {
            FlowNode source = edge.getSource();
            FlowNode target = edge.getTarget();
            if (source != null && target != null &&
                validNodes.containsKey(source.getId()) &&
                validNodes.containsKey(target.getId()) &&
                !hasArrowInAnyField(source) &&
                !hasArrowInAnyField(target) &&
                !shouldFilterNode(source) &&
                !shouldFilterNode(target)) {
                FlowNode safeSource = validNodes.get(source.getId());
                FlowNode safeTarget = validNodes.get(target.getId());
                FlowEdge newEdge = new FlowEdge();
                newEdge.setSource(safeSource);
                newEdge.setTarget(safeTarget);
                newEdge.setCallType(edge.getCallType());
                newEdge.setCallCount(edge.getCallCount());
                newEdge.setCondition(edge.getCondition());
                filtered.addEdge(newEdge);
            }
        }

        return filtered;
    }

    /**
     * 【统一过滤】检查节点是否包含 "->"（任何字段）
     */
    private boolean hasArrowInAnyField(FlowNode node) {
        if (node == null) return true;
        return containsArrow(node.getMethodName()) ||
               containsArrow(node.getDisplayName()) ||
               containsArrow(node.getClassName()) ||
               containsArrow(node.getId()) ||
               containsArrow(node.getMethodSignature());
    }

    /**
     * 【统一方法】检查字符串是否包含 "->"
     */
    private boolean containsArrow(String s) {
        return s != null && (s.equals("->") || s.equals("-->") || s.contains("->") || s.contains("-->"));
    }

    /**
     * 生成指定样式和主题的 PlantUML 格式的方法调用链
     */
    public String generatePlantUml(FlowGraph graph, DiagramStyle style, ChartTheme theme) {
        // 先过滤掉所有包含 "->" 的节点和边
        FlowGraph safeGraph = filterGraph(graph);

        if (theme == null) {
            theme = ChartTheme.defaultTheme();
        }
        String plantuml;
        switch (style) {
            case SEQUENCE:
                plantuml = generateSequenceDiagram(safeGraph, theme);
                break;
            case COMPONENT:
            case C4:
                plantuml = generateComponentDiagram(safeGraph, theme);
                break;
            case STATE:
                plantuml = generateStateDiagram(safeGraph, theme);
                break;
            case MINDMAP:
                plantuml = generateMindmapDiagram(safeGraph, theme);
                break;
            case OBJECT:
                plantuml = generateObjectDiagram(safeGraph, theme);
                break;
            case DEPLOYMENT:
                plantuml = generateDeploymentDiagram(safeGraph, theme);
                break;
            case USECASE:
                plantuml = generateUsecaseDiagram(safeGraph, theme);
                break;
            case TIMING:
                plantuml = generateTimingDiagram(safeGraph, theme);
                break;
            case GANTT:
                plantuml = generateGanttDiagram(safeGraph, theme);
                break;
            case WBS:
                plantuml = generateWbsDiagram(safeGraph, theme);
                break;
            case ACTIVITY:
            case FLOWCHART:
            case WORKFLOW:
            default:
                plantuml = generateActivityDiagram(safeGraph, theme);
                break;
        }

        // 【第一道】最终安全检查：过滤掉任何包含 "->" 作为节点内容的行
        plantuml = filterFinalPlantUml(plantuml);

        // 【第二道】简单粗暴但有效的全局替换：任何看起来像 "->" 节点的都处理掉
        plantuml = bruteForceFilter(plantuml);

        return plantuml;
    }

    /**
     * 【终极防线】简单粗暴但有效的全局过滤
     * 直接移除任何可能表示 "->" 节点的内容
     */
    private String bruteForceFilter(String plantuml) {
        if (plantuml == null || plantuml.isEmpty()) {
            return plantuml;
        }

        String result = plantuml;

        // 1. 移除任何 "->" 节点内容（引号中的）
        result = result.replace("\"->\"", "\"\"");
        result = result.replace("'->'", "\"\"");

        // 2. 移除任何包含 "-" 和 ">" 在一起的节点内容（限制在节点定义中）
        // 格式通常是: xxx "..." yyy
        result = result.replaceAll("\"[^\"]*->[^\"]*\"", "\"\"");
        result = result.replaceAll("'[^']*->[^']*'", "\"\"");

        // 3. 移除类似 ":->;" 这样的活动图节点
        result = result.replaceAll(":\\s*->\\s*;", ":skipped;");

        // 4. 移除单独出现的 "->" 或 "-->" 作为节点内容的行
        java.util.List<String> lines = new java.util.ArrayList<>();
        for (String line : result.split("\n")) {
            String trimmed = line.trim();

            // 跳过任何看起来像是 "->" 节点的行
            boolean isBadLine = false;

            // 检查是否是节点定义且包含 "->"
            if ((trimmed.startsWith("component ") || trimmed.startsWith("state ") ||
                 trimmed.startsWith("object ") || trimmed.startsWith("participant ") ||
                 trimmed.startsWith(":")) &&
                (trimmed.contains("\"->\"") || trimmed.contains("'->'") ||
                 (trimmed.contains("-") && trimmed.contains(">")))) {

                // 但要排除真正的箭头连接 (A --> B)
                if (!trimmed.matches(".*\\w+\\s+-->?\\s+\\w+.*")) {
                    isBadLine = true;
                }
            }

            // 检查是否是仅仅包含 "->" 的节点
            if (trimmed.contains("->") &&
                (trimmed.startsWith("state \"->") ||
                 trimmed.startsWith("component \"->") ||
                 trimmed.startsWith("object \"->"))) {
                isBadLine = true;
            }

            if (!isBadLine) {
                lines.add(line);
            }
        }

        return String.join("\n", lines);
    }

    /**
     * 最终安全过滤：
     * 【通用】移除任何包含 "->" 作为节点内容的行（所有格式）
     * 1. 活动图：:->;
     * 2. 状态图：state "->" as ...
     * 3. 组件图：component "->" as ...
     * 4. 其他任何格式："->" 作为节点名称的
     */
    private String filterFinalPlantUml(String plantuml) {
        if (plantuml == null || plantuml.isEmpty()) {
            return plantuml;
        }

        // 分行处理
        String[] lines = plantuml.split("\n");
        java.util.List<String> resultLines = new java.util.ArrayList<>();

        for (String line : lines) {
            String trimmed = line.trim();

            // === 【通用】删除任何包含 "->" 作为节点内容的行 ===

            // 1. 活动图/流程图：:->; 或 :...->...;
            if (trimmed.startsWith(":") && trimmed.contains("->")) {
                continue;
            }

            // 2. 状态图：state "->" as ... 或 state -> as ...
            if ((trimmed.startsWith("state ") || trimmed.startsWith("State ")) &&
                (trimmed.contains("\"->\"") || trimmed.contains("'->'") || trimmed.contains("->"))) {
                continue;
            }

            // 3. 组件图：component "->" as ... 或 component -> as ...
            if ((trimmed.startsWith("component ") || trimmed.startsWith("Component ")) &&
                (trimmed.contains("\"->\"") || trimmed.contains("'->'") || trimmed.contains("->"))) {
                continue;
            }

            // 4. 对象图：object "->" as ...
            if ((trimmed.startsWith("object ") || trimmed.startsWith("Object ")) &&
                (trimmed.contains("\"->\"") || trimmed.contains("'->'") || trimmed.contains("->"))) {
                continue;
            }

            // 5. 通用：任何节点定义中包含 "->" 作为名称的
            if ((trimmed.contains("\"->\"") || trimmed.contains("'->'")) &&
                (trimmed.contains("as ") || trimmed.contains("state ") ||
                 trimmed.contains("component ") || trimmed.contains("object "))) {
                continue;
            }

            // 6. 最直接：任何行包含 "->" 且看起来像节点（不是箭头连接）
            // 箭头连接通常是：A --> B, A -> B, A -down-> B
            // 节点内容通常是："->" 出现在引号中或作为第一个内容
            boolean isArrowConnection =
                (trimmed.contains(" --> ") || trimmed.contains(" -> ") || trimmed.contains(" -")) &&
                !trimmed.contains("\"->\"") && !trimmed.contains("'->'");

            if (!isArrowConnection && trimmed.contains("->")) {
                // 检查是否是节点内容（不是连接）
                if (trimmed.contains("\"->\"") || trimmed.contains("'->'") ||
                    trimmed.matches(".*\\s+->\\s+.*") || trimmed.matches(".*->.*")) {
                    // 再排除真正的箭头连接
                    if (!(trimmed.matches(".*\\w+\\s+-->?\\s+\\w+.*")) &&
                        !(trimmed.matches("^\\s*[a-zA-Z0-9_]+\\s+-->?\\s+[a-zA-Z0-9_]+.*$"))) {
                        continue;
                    }
                }
            }

            // 7. 单独的 "->" 节点（任何格式）
            if (trimmed.equals("->") || trimmed.equals("-->")) {
                continue;
            }

            // 8. 任何显示为 ":->;" 或类似的
            if (trimmed.startsWith(":") && trimmed.length() <= 5 && trimmed.contains("-") && trimmed.contains(">")) {
                continue;
            }

            // 保留其他所有行
            resultLines.add(line);
        }

        // 最后清理：去除连续空行
        java.util.List<String> finalLines = new java.util.ArrayList<>();
        boolean lastWasEmpty = false;
        for (String line : resultLines) {
            boolean isEmpty = line.trim().isEmpty();
            if (isEmpty && lastWasEmpty) {
                continue; // 跳过连续空行
            }
            finalLines.add(line);
            lastWasEmpty = isEmpty;
        }

        return String.join("\n", finalLines);
    }

    /**
     * 判断是否应该过滤该节点
     */
    private boolean shouldFilterNode(FlowNode node) {
        if (node == null) return true;

        // 1. 【统一】过滤任何包含"->"的字段
        if (hasArrowInAnyField(node)) {
            return true;
        }

        // 过滤类节点（只保留方法节点）
        if (node.getType() == FlowNode.NodeType.CLASS) {
            return true;
        }

        String className = node.getClassName();
        String methodName = node.getMethodName();

        if (className == null || className.isEmpty()) return false;

        // 过滤JDK包
        for (String prefix : JDK_PACKAGES) {
            if (className.startsWith(prefix)) {
                return true;
            }
        }

        // 过滤JDK类
        String simpleClassName = className;
        int lastDot = className.lastIndexOf('.');
        if (lastDot > 0) {
            simpleClassName = className.substring(lastDot + 1);
        }
        if (JDK_CLASSES.contains(simpleClassName)) {
            return true;
        }

        // 过滤setter/getter方法
        if (methodName != null && node.getType() == FlowNode.NodeType.METHOD) {
            if ((methodName.startsWith("get") && methodName.length() > 3) ||
                (methodName.startsWith("set") && methodName.length() > 3) ||
                (methodName.startsWith("is") && methodName.length() > 2) ||
                methodName.equals("toString") ||
                methodName.equals("equals") ||
                methodName.equals("hashCode") ||
                methodName.equals("clone")) {
                return true;
            }
        }

        return false;
    }

    /**
     * 判断是否应该过滤该边
     */
    private boolean shouldFilterEdge(FlowEdge edge) {
        return shouldFilterNode(edge.getSource()) || shouldFilterNode(edge.getTarget());
    }

    /**
     * 生成活动图格式
     */
    private String generateActivityDiagram(FlowGraph graph) {
        return generateActivityDiagram(graph, ChartTheme.defaultTheme());
    }

    /**
     * 生成活动图格式（带主题）- 完美方案！
     */
    private String generateActivityDiagram(FlowGraph graph, ChartTheme theme) {
        // 第一步：先收集所有有效节点 - 只从 graph.getAllNodes() 收集，不从边收集！
        List<String> nodes = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (FlowNode node : graph.getAllNodes()) {
            if (node == null) continue;
            if (node.getType() != FlowNode.NodeType.METHOD) continue;

            // 最严格的检查：任何字段都不能有 "-->"
            if (hasArrowInAnyField(node)) continue;
            if (shouldFilterNode(node)) continue;

            String label = getCleanLabel(node);
            if (isValidCleanLabel(label) && !seen.contains(label)) {
                nodes.add(label);
                seen.add(label);
            }
        }

        // 第二步：生成最简单、绝对正确的 PlantUML
        StringBuilder sb = new StringBuilder();
        sb.append("@startuml\n");
        sb.append("skinparam backgroundColor #fffaf0\n");
        sb.append("skinparam handwritten false\n");
        sb.append("skinparam shadowing true\n");
        sb.append("skinparam activity {\n");
        sb.append("  BackgroundColor #ffeaa7\n");
        sb.append("  BorderColor #d63031\n");
        sb.append("  ArrowColor #e17055\n");
        sb.append("  StartColor #4CAF50\n");
        sb.append("  EndColor #F44336\n");
        sb.append("}\n");
        sb.append("skinparam noteBackgroundColor #fff9c4\n");
        sb.append("skinparam noteBorderColor #ffc107\n");
        sb.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            sb.append("title ").append(escapeLabel(graph.getName())).append("\n");
            sb.append("\n");
        }
        sb.append("start\n");
        sb.append("\n");

        int limit = Math.min(nodes.size(), 20);
        for (int i = 0; i < limit; i++) {
            if (i > 0) {
                sb.append("-->\n");
            }
            sb.append(":").append(escapeLabel(nodes.get(i))).append(";\n");
        }

        if (nodes.isEmpty()) {
            sb.append(":开始处理;\n");
            sb.append("-->\n");
            sb.append(":结束;\n");
        }

        sb.append("\nstop\n");
        sb.append("@enduml\n");

        return sb.toString();
    }

    /**
     * 获取干净的标签（调用前已通过 hasArrowInAnyField 检查
     */
    private String getCleanLabel(FlowNode node) {
        String className = node.getClassName();
        String methodName = node.getMethodName();

        // 获取简单类名
        String simpleClassName = className;
        int lastDot = className.lastIndexOf('.');
        if (lastDot > 0) {
            simpleClassName = className.substring(lastDot + 1);
        }

        // 如果有中文翻译就加上
        String chineseNote = getMethodTranslation(methodName);
        if (!chineseNote.isEmpty()) {
            return simpleClassName + "." + methodName + "\\n(" + chineseNote + ")";
        } else {
            return simpleClassName + "." + methodName;
        }
    }

    private boolean isValidCleanLabel(String label) {
        return label != null && !label.isEmpty() && label.contains(".");
    }

    /**
     * 生成时序图格式
     */
    private String generateSequenceDiagram(FlowGraph graph) {
        return generateSequenceDiagram(graph, ChartTheme.defaultTheme());
    }

    /**
     * 生成时序图格式（带主题）
     */
    private String generateSequenceDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam sequenceMessageAlign center\n");
        plantuml.append("skinparam noteBackgroundColor #fff9c4\n");
        plantuml.append("skinparam sequenceParticipant {\n");
        plantuml.append("  BackgroundColor ").append(theme.getParticipantNodeColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getClassNodeColor()).append("\n");
        plantuml.append("}\n");
        plantuml.append("skinparam sequenceArrow {\n");
        plantuml.append("  Color ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("  Thickness 2\n");
        plantuml.append("}\n");
        plantuml.append("skinparam boxPadding 10\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
        } else {
            plantuml.append("title 方法调用时序图\n");
        }
        plantuml.append("skinparam maxMessageSize 100\n");
        plantuml.append("\n");

        Set<String> participants = new LinkedHashSet<>();
        List<MessageInfo> messages = new ArrayList<>();

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;

            if (edge.getSource() != null && edge.getTarget() != null) {
                // 【额外防线】再次检查节点本身
                if (hasArrowInAnyField(edge.getSource()) || hasArrowInAnyField(edge.getTarget())) {
                    continue;
                }

                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));
                String sourceDesc = escapeLabel(getShortDescription(edge.getSource()));
                String targetDesc = escapeLabel(getShortDescription(edge.getTarget()));

                // 【最终防线】再次检查标签内容
                if (containsArrow(sourceLabel) || containsArrow(targetLabel)) continue;

                if (sourceLabel.isEmpty() || targetLabel.isEmpty()) continue;

                participants.add(sourceLabel);
                participants.add(targetLabel);

                String callNote = getMethodName(edge.getTarget());
                messages.add(new MessageInfo(sourceLabel, targetLabel, callNote));

                if (messages.size() >= 15) break;
            }
        }

        for (String p : participants) {
            plantuml.append("participant \"").append(p).append("\" as p_")
                    .append(Math.abs(p.hashCode())).append("\n");
        }
        plantuml.append("\n");

        for (MessageInfo msg : messages) {
            String fromId = "p_" + Math.abs(msg.from.hashCode());
            String toId = "p_" + Math.abs(msg.to.hashCode());
            plantuml.append(fromId).append(" -> ").append(toId)
                    .append(" : ").append(msg.note).append("\n");
        }

        if (messages.isEmpty()) {
            plantuml.append("participant Start\n");
            plantuml.append("participant End\n");
            plantuml.append("Start -> End : 调用\n");
        }

        plantuml.append("\n@enduml\n");
        String result = plantuml.toString();
        result = result.replaceAll("(?m)^\\s*:.*->.*;\\s*$", "");  // 删除含箭头的节点行
        result = result.replaceAll("(?m)^\\s*$", "");  // 删除空行
        return result.trim() + "\n";
    }

    /**
     * 生成组件图格式
     */
    private String generateComponentDiagram(FlowGraph graph) {
        return generateComponentDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateComponentDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam componentStyle rectangle\n");
        plantuml.append("skinparam shadowing ").append(theme.isShowShadow()).append("\n");
        plantuml.append("skinparam component {\n");
        plantuml.append("  BackgroundColor ").append(theme.getActivityBackgroundColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getClassNodeColor()).append("\n");
        plantuml.append("  ArrowColor ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("  LineThickness 2\n");
        plantuml.append("}\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
        } else {
            plantuml.append("title 方法调用组件图\n");
        }
        plantuml.append("\n");

        Set<String> components = new HashSet<>();
        Set<String> connections = new HashSet<>();
        int count = 0;

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;

            if (edge.getSource() != null && edge.getTarget() != null) {
                // 【额外防线】再次检查节点本身
                if (hasArrowInAnyField(edge.getSource()) || hasArrowInAnyField(edge.getTarget())) {
                    continue;
                }

                String sourceId = getNodeId(edge.getSource());
                String targetId = getNodeId(edge.getTarget());
                String sourceLabel = escapeLabel(getDescriptiveLabel(edge.getSource()));
                String targetLabel = escapeLabel(getDescriptiveLabel(edge.getTarget()));
                String connectionKey = sourceId + "|" + targetId;

                if (sourceLabel.isEmpty() || targetLabel.isEmpty()) continue;

                // 【最终防线】再次检查标签内容
                if (containsArrow(sourceLabel) || containsArrow(targetLabel)) continue;

                if (!components.contains(sourceId)) {
                    plantuml.append("component \"").append(sourceLabel).append("\" as ")
                            .append(sourceId).append("\n");
                    components.add(sourceId);
                }
                if (!components.contains(targetId)) {
                    plantuml.append("component \"").append(targetLabel).append("\" as ")
                            .append(targetId).append("\n");
                    components.add(targetId);
                }

                if (!connections.contains(connectionKey)) {
                    plantuml.append(sourceId).append(" --> ").append(targetId).append("\n");
                    connections.add(connectionKey);
                    count++;
                }

                if (count >= 15) break;
            }
        }

        if (count == 0) {
            plantuml.append("component \"开始\" as start\n");
            plantuml.append("component \"结束\" as end\n");
            plantuml.append("start --> end\n");
        }

        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成状态图格式
     */
    private String generateStateDiagram(FlowGraph graph) {
        return generateStateDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateStateDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam shadowing ").append(theme.isShowShadow()).append("\n");
        plantuml.append("skinparam state {\n");
        plantuml.append("  BackgroundColor ").append(theme.getActivityBackgroundColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getMethodNodeColor()).append("\n");
        plantuml.append("  ArrowColor ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("}\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
        } else {
            plantuml.append("title 方法调用状态图\n");
        }
        plantuml.append("\n");
        plantuml.append("[*] --> Start\n");
        plantuml.append("\n");

        Set<String> states = new HashSet<>();
        Set<String> transitions = new HashSet<>();
        String lastState = "Start";
        int count = 0;
        FlowEdge firstEdge = null;

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;
            if (firstEdge == null) firstEdge = edge;

            if (edge.getSource() != null && edge.getTarget() != null) {
                // 【额外防线】再次检查节点本身
                if (hasArrowInAnyField(edge.getSource()) || hasArrowInAnyField(edge.getTarget())) {
                    continue;
                }

                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                // 【最终防线】再次检查标签内容
                if (containsArrow(sourceLabel) || containsArrow(targetLabel)) continue;

                if (sourceLabel.isEmpty() || targetLabel.isEmpty()) continue;

                String sourceState = "S_" + Math.abs(sourceLabel.hashCode());
                String targetState = "S_" + Math.abs(targetLabel.hashCode());
                String transitionKey = sourceState + "|" + targetState;

                if (!states.contains(sourceState)) {
                    plantuml.append("state \"").append(sourceLabel).append("\" as ").append(sourceState).append("\n");
                    states.add(sourceState);
                }
                if (!states.contains(targetState)) {
                    plantuml.append("state \"").append(targetLabel).append("\" as ").append(targetState).append("\n");
                    states.add(targetState);
                }

                if (!transitions.contains(transitionKey)) {
                    plantuml.append(sourceState).append(" --> ").append(targetState).append("\n");
                    transitions.add(transitionKey);
                    lastState = targetState;
                    count++;
                }

                if (count >= 15) break;
            }
        }

        if (count == 0) {
            plantuml.append("state \"开始\" as S_start\n");
            plantuml.append("state \"结束\" as S_end\n");
            plantuml.append("Start --> S_start\n");
            plantuml.append("S_start --> S_end\n");
            lastState = "S_end";
        } else if (firstEdge != null) {
            String firstLabel = escapeLabel(getSimpleNodeLabel(firstEdge.getSource()));
            plantuml.append("Start --> S_").append(Math.abs(firstLabel.hashCode())).append("\n");
        }

        plantuml.append(lastState).append(" --> [*]\n");
        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成思维导图格式
     */
    private String generateMindmapDiagram(FlowGraph graph) {
        return generateMindmapDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateMindmapDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startmindmap\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam handwritten false\n");
        plantuml.append("skinparam mindmapBorderColor ").append(theme.getMethodNodeColor()).append("\n");
        plantuml.append("skinparam mindmapBorderThickness 2\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
        } else {
            plantuml.append("title 方法调用思维导图\n");
        }
        plantuml.append("\n");

        Map<String, List<String>> tree = new LinkedHashMap<>();
        Set<String> allNodes = new LinkedHashSet<>();
        String rootNode = null;

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;

            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceLabel = escapeLabel(getSimpleNodeLabel(edge.getSource()));
                String targetLabel = escapeLabel(getSimpleNodeLabel(edge.getTarget()));

                if (sourceLabel.isEmpty() || targetLabel.isEmpty()) continue;

                if (rootNode == null) {
                    rootNode = sourceLabel;
                }

                allNodes.add(sourceLabel);
                allNodes.add(targetLabel);

                tree.computeIfAbsent(sourceLabel, k -> new ArrayList<>()).add(targetLabel);
            }
        }

        if (rootNode == null && !allNodes.isEmpty()) {
            rootNode = allNodes.iterator().next();
        }

        if (rootNode != null) {
            Set<String> added = new HashSet<>();
            plantuml.append("* ").append(rootNode).append("\n");
            added.add(rootNode);

            List<String> level1 = tree.getOrDefault(rootNode, new ArrayList<>());
            int level1Count = 0;
            for (String child : level1) {
                if (!added.contains(child)) {
                    plantuml.append("** ").append(child).append("\n");
                    added.add(child);

                    List<String> level2 = tree.getOrDefault(child, new ArrayList<>());
                    for (String grandchild : level2) {
                        if (!added.contains(grandchild)) {
                            plantuml.append("*** ").append(grandchild).append("\n");
                            added.add(grandchild);
                        }
                    }
                    level1Count++;
                    if (level1Count >= 8) break;
                }
            }

            if (level1Count == 0) {
                for (String node : allNodes) {
                    if (!node.equals(rootNode) && !added.contains(node)) {
                        plantuml.append("** ").append(node).append("\n");
                        added.add(node);
                        if (added.size() >= 10) break;
                    }
                }
            }
        }

        if (rootNode == null) {
            plantuml.append("* 方法调用链\n");
            plantuml.append("** 调用关系分析\n");
        }

        plantuml.append("\n@endmindmap\n");
        return plantuml.toString();
    }

    /**
     * 获取简化的节点标签
     */
    private String getSimpleNodeLabel(FlowNode node) {
        if (node == null) {
            return "";
        }

        // 【第一道防线】全字段检查
        if (hasArrowInAnyField(node)) {
            return "";
        }

        if (node.getType() == FlowNode.NodeType.METHOD) {
            String className = node.getClassName() != null ? node.getClassName() : "";
            String methodName = node.getMethodName() != null ? node.getMethodName() : "";
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : methodName;

            // 【第二道防线】单独检查每个字段
            if (methodName == null || methodName.isEmpty() ||
                methodName.equals("->") || methodName.contains("->") ||
                (displayName != null && (displayName.equals("->") || displayName.contains("->"))) ||
                (className != null && (className.equals("->") || className.contains("->")))) {
                return "";
            }

            String label;
            if (!className.isEmpty()) {
                String simpleClassName = className;
                int lastDot = className.lastIndexOf('.');
                if (lastDot > 0) {
                    simpleClassName = className.substring(lastDot + 1);
                }
                label = simpleClassName + "." + displayName;
            } else {
                label = displayName;
            }

            // 【第三道防线】最终检查
            if (label == null || label.isEmpty() || label.equals("->") || label.contains("->")) {
                return "";
            }
            return label;
        } else {
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : node.getClassName();
            if (displayName == null || displayName.isEmpty() ||
                displayName.equals("->") || displayName.contains("->")) {
                return "";
            }

            int lastDot = displayName.lastIndexOf('.');
            if (lastDot > 0) {
                displayName = displayName.substring(lastDot + 1);
            }

            if (displayName == null || displayName.isEmpty() ||
                displayName.equals("->") || displayName.contains("->")) {
                return "";
            }

            return displayName;
        }
    }

    /**
     * 获取带描述的节点标签（包含方法名和类名）
     */
    private String getDescriptiveLabel(FlowNode node) {
        if (node == null) {
            return "";
        }

        // 先做全字段检查
        if (hasArrowInAnyField(node)) {
            return "";
        }

        if (node.getType() == FlowNode.NodeType.METHOD) {
            String className = node.getClassName() != null ? node.getClassName() : "";
            String methodName = node.getMethodName() != null ? node.getMethodName() : "";

            // 最严格的验证
            if (methodName == null || methodName.isEmpty() ||
                methodName.equals("->") || methodName.contains("->") ||
                (className != null && (className.equals("->") || className.contains("->")))) {
                return "";
            }

            String label;
            if (!className.isEmpty()) {
                String simpleClassName = className;
                int lastDot = className.lastIndexOf('.');
                if (lastDot > 0) {
                    simpleClassName = className.substring(lastDot + 1);
                }
                String chineseNote = getMethodTranslation(methodName);
                if (!chineseNote.isEmpty()) {
                    label = simpleClassName + "." + methodName + "\\n(" + chineseNote + ")";
                } else {
                    label = simpleClassName + "." + methodName;
                }
            } else {
                label = methodName;
            }

            // 最终检查
            if (label == null || label.isEmpty() || label.equals("->") || label.contains("->")) {
                return "";
            }
            return label;
        } else {
            String displayName = node.getDisplayName() != null ? node.getDisplayName() : node.getClassName();
            if (displayName == null || displayName.isEmpty() ||
                displayName.equals("->") || displayName.contains("->")) {
                return "";
            }

            int lastDot = displayName.lastIndexOf('.');
            if (lastDot > 0) {
                displayName = displayName.substring(lastDot + 1);
            }

            if (displayName == null || displayName.isEmpty() ||
                displayName.equals("->") || displayName.contains("->")) {
                return "";
            }

            return displayName;
        }
    }

    /**
     * 获取简短描述
     */
    private String getShortDescription(FlowNode node) {
        if (node.getType() == FlowNode.NodeType.METHOD) {
            String methodName = node.getMethodName() != null ? node.getMethodName() : "";
            return getMethodTranslation(methodName);
        }
        return "";
    }

    /**
     * 获取方法名
     */
    private String getMethodName(FlowNode node) {
        if (node.getType() == FlowNode.NodeType.METHOD) {
            return node.getMethodName() != null ? node.getMethodName() : "call";
        }
        return "call";
    }

    /**
     * 获取方法的完整中文翻译
     */
    private String getMethodTranslation(String methodName) {
        if (methodName == null || methodName.isEmpty()) return "";

        // 首先尝试精确匹配
        String translation = METHOD_TRANSLATIONS.get(methodName);
        if (translation != null) {
            return translation;
        }

        // 尝试前缀匹配（大小写不敏感）
        String lowerName = methodName.toLowerCase();
        for (Map.Entry<String, String> entry : METHOD_TRANSLATIONS.entrySet()) {
            String key = entry.getKey().toLowerCase();
            if (lowerName.startsWith(key) && key.length() >= 2) {
                String remaining = methodName.substring(entry.getKey().length());
                if (!remaining.isEmpty()) {
                    String translatedRemaining = camelToChinese(remaining);
                    return entry.getValue() + translatedRemaining;
                }
                return entry.getValue();
            }
        }

        // 驼峰转中文
        return camelToChinese(methodName);
    }

    /**
     * 驼峰命名转中文描述
     */
    private String camelToChinese(String s) {
        if (s == null || s.isEmpty()) return "";

        StringBuilder result = new StringBuilder();
        boolean first = true;

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isUpperCase(c)) {
                if (!first) {
                    result.append("");
                }
                result.append(Character.toLowerCase(c));
                first = false;
            } else {
                result.append(c);
                first = false;
            }
        }

        return result.toString();
    }

    /**
     * 获取节点的 PlantUML ID（去除特殊字符）
     */
    private String getNodeId(FlowNode node) {
        String id = node.getFullId();
        if (id == null) {
            id = "node_" + System.identityHashCode(node);
        }
        return id.replaceAll("[^a-zA-Z0-9_]", "_");
    }

    /**
     * 检查标签是否有效
     */
    private boolean isValidLabel(String label) {
        if (label == null || label.isEmpty()) {
            return false;
        }
        if (label.equals("->") || label.contains("->")) {
            return false;
        }
        // 只允许安全字符：字母、数字、下划线、点、空格、括号、中文
        if (!label.matches("^[a-zA-Z0-9_\\.\\s\\(\\)\\u4e00-\\u9fa5\\\\n]+$")) {
            return false;
        }
        return true;
    }

    /**
     * 转义标签中的特殊字符
     * 【最终防线】返回空字符串表示这个标签不能使用
     */
    private String escapeLabel(String label) {
        if (label == null || label.isEmpty()) {
            return "";
        }
        // 再次确保不允许"->"
        if (containsArrow(label)) {
            return "";
        }
        return label.replace("\"", "'")
                .replace("\n", " ")
                .replace(";", ",");
    }

    /**
     * 保存 PlantUML 到文件
     */
    public void saveToFile(FlowGraph graph, File outputFile) throws IOException {
        String plantuml = generatePlantUml(graph);

        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(plantuml);
        }

        log.info("PlantUML 方法调用链已保存到: {}", outputFile.getAbsolutePath());
    }

    /**
     * 生成对象图格式
     */
    private String generateObjectDiagram(FlowGraph graph) {
        return generateObjectDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateObjectDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam object {\n");
        plantuml.append("  BackgroundColor ").append(theme.getActivityBackgroundColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getExternalNodeColor()).append("\n");
        plantuml.append("  ArrowColor ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("}\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        Set<String> processedNodes = new HashSet<>();
        Set<String> processedEdges = new HashSet<>();

        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String label = escapeLabel(getSimpleNodeLabel(node));
            if (label.isEmpty()) continue;
            String nodeId = getNodeId(node);
            if (!processedNodes.contains(nodeId)) {
                plantuml.append("object \"").append(label).append("\" as ").append(nodeId).append("\n");
                processedNodes.add(nodeId);
            }
        }

        plantuml.append("\n");

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceId = getNodeId(edge.getSource());
                String targetId = getNodeId(edge.getTarget());
                String edgeKey = sourceId + "|" + targetId;
                if (!processedNodes.contains(sourceId) || !processedNodes.contains(targetId)) continue;
                if (!processedEdges.contains(edgeKey)) {
                    plantuml.append(sourceId).append(" --> ").append(targetId).append("\n");
                    processedEdges.add(edgeKey);
                }
                if (processedEdges.size() >= 20) break;
            }
        }

        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成部署图格式
     */
    private String generateDeploymentDiagram(FlowGraph graph) {
        return generateDeploymentDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateDeploymentDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam node {\n");
        plantuml.append("  BackgroundColor ").append(theme.getActivityBackgroundColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getClassNodeColor()).append("\n");
        plantuml.append("  ArrowColor ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("}\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        Set<String> processedNodes = new HashSet<>();
        Set<String> processedEdges = new HashSet<>();
        int nodeCount = 0;

        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String label = escapeLabel(getSimpleNodeLabel(node));
            if (label.isEmpty()) continue;
            String nodeId = getNodeId(node);
            if (!processedNodes.contains(nodeId)) {
                plantuml.append("node \"").append(label).append("\" as ").append(nodeId).append("\n");
                processedNodes.add(nodeId);
                nodeCount++;
                if (nodeCount >= 10) break;
            }
        }

        plantuml.append("\n");

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceId = getNodeId(edge.getSource());
                String targetId = getNodeId(edge.getTarget());
                String edgeKey = sourceId + "|" + targetId;
                if (!processedNodes.contains(sourceId) || !processedNodes.contains(targetId)) continue;
                if (!processedEdges.contains(edgeKey)) {
                    plantuml.append(sourceId).append(" --> ").append(targetId).append("\n");
                    processedEdges.add(edgeKey);
                }
                if (processedEdges.size() >= 15) break;
            }
        }

        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成用例图格式
     */
    private String generateUsecaseDiagram(FlowGraph graph) {
        return generateUsecaseDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateUsecaseDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam usecase {\n");
        plantuml.append("  BackgroundColor ").append(theme.getActivityBackgroundColor()).append("\n");
        plantuml.append("  BorderColor ").append(theme.getMethodNodeColor()).append("\n");
        plantuml.append("  ArrowColor ").append(theme.getCallEdgeColor()).append("\n");
        plantuml.append("}\n");
        plantuml.append("left to right direction\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        Set<String> processedNodes = new HashSet<>();
        Set<String> processedEdges = new HashSet<>();
        int usecaseCount = 0;

        plantuml.append("actor User\n");
        plantuml.append("\n");
        plantuml.append("rectangle System {\n");

        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String label = escapeLabel(getSimpleNodeLabel(node));
            if (label.isEmpty()) continue;
            String nodeId = getNodeId(node);
            if (!processedNodes.contains(nodeId)) {
                plantuml.append("  usecase \"").append(label).append("\" as ").append(nodeId).append("\n");
                processedNodes.add(nodeId);
                usecaseCount++;
                if (usecaseCount >= 10) break;
            }
        }

        plantuml.append("}\n");
        plantuml.append("\n");

        if (!processedNodes.isEmpty()) {
            String firstNode = processedNodes.iterator().next();
            plantuml.append("User --> ").append(firstNode).append("\n");
        }

        for (FlowEdge edge : graph.getEdges()) {
            if (shouldFilterEdge(edge)) continue;
            if (edge.getSource() != null && edge.getTarget() != null) {
                String sourceId = getNodeId(edge.getSource());
                String targetId = getNodeId(edge.getTarget());
                String edgeKey = sourceId + "|" + targetId;
                if (!processedNodes.contains(sourceId) || !processedNodes.contains(targetId)) continue;
                if (!processedEdges.contains(edgeKey)) {
                    plantuml.append(sourceId).append(" --> ").append(targetId).append("\n");
                    processedEdges.add(edgeKey);
                }
                if (processedEdges.size() >= 15) break;
            }
        }

        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成定时图格式
     */
    private String generateTimingDiagram(FlowGraph graph) {
        return generateTimingDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateTimingDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("skinparam sequenceMessageAlign center\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        Set<String> participants = new LinkedHashSet<>();
        List<String> nodeLabels = new ArrayList<>();

        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String label = escapeLabel(getSimpleNodeLabel(node));
            if (label.isEmpty()) continue;
            if (!participants.contains(label)) {
                participants.add(label);
                nodeLabels.add(label);
                if (participants.size() >= 5) break;
            }
        }

        for (String p : nodeLabels) {
            plantuml.append("concise \"").append(p).append("\" as p_")
                    .append(Math.abs(p.hashCode())).append("\n");
        }

        plantuml.append("\n");

        if (nodeLabels.size() >= 2) {
            plantuml.append("@0\n");
            for (String p : nodeLabels) {
                plantuml.append("p_").append(Math.abs(p.hashCode())).append(" is Idle\n");
            }
            plantuml.append("\n");

            plantuml.append("@100\n");
            String first = nodeLabels.get(0);
            String second = nodeLabels.get(1);
            plantuml.append("p_").append(Math.abs(first.hashCode()))
                    .append(" -> p_").append(Math.abs(second.hashCode()))
                    .append(" : call\n");
            plantuml.append("p_").append(Math.abs(second.hashCode())).append(" is Active\n");
            plantuml.append("\n");

            plantuml.append("@200\n");
            plantuml.append("p_").append(Math.abs(second.hashCode())).append(" is Idle\n");
            if (nodeLabels.size() >= 2) {
                plantuml.append("p_").append(Math.abs(second.hashCode()))
                        .append(" -> p_").append(Math.abs(first.hashCode()))
                        .append(" : return\n");
            }
        }

        plantuml.append("\n@enduml\n");
        return plantuml.toString();
    }

    /**
     * 生成甘特图格式
     */
    private String generateGanttDiagram(FlowGraph graph) {
        return generateGanttDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateGanttDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startgantt\n");
        plantuml.append("Project starts 2024-01-01\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        List<String> tasks = new ArrayList<>();
        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String label = getSimpleNodeLabel(node);
            if (label.isEmpty()) continue;
            // 清理标签，只保留安全字符
            label = label.replaceAll("[^a-zA-Z0-9\\s]", "");
            label = label.trim();
            if (label.isEmpty() || label.length() > 50) {
                label = "Task " + (tasks.size() + 1);
            }
            if (!tasks.contains(label)) {
                tasks.add(label);
                if (tasks.size() >= 5) break;
            }
        }

        // 如果没有任务，添加一个默认任务
        if (tasks.isEmpty()) {
            tasks.add("Method Call Analysis");
        }

        for (int i = 0; i < tasks.size(); i++) {
            String task = tasks.get(i);
            int duration = Math.max(1, (i % 3) + 1);
            plantuml.append("[").append(task).append("] lasts ").append(duration).append(" days\n");
            if (i > 0) {
                String prevTask = tasks.get(i - 1);
                plantuml.append("[").append(task).append("] starts at [").append(prevTask).append("]'s end\n");
            }
        }

        plantuml.append("\n@endgantt\n");
        return plantuml.toString();
    }

    /**
     * 生成 WBS 图格式
     */
    private String generateWbsDiagram(FlowGraph graph) {
        return generateWbsDiagram(graph, ChartTheme.defaultTheme());
    }

    private String generateWbsDiagram(FlowGraph graph, ChartTheme theme) {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startwbs\n");
        plantuml.append("skinparam backgroundColor ").append(theme.getBackgroundColor()).append("\n");
        plantuml.append("\n");
        if (graph.getName() != null && !graph.getName().isEmpty()) {
            plantuml.append("title ").append(escapeLabel(graph.getName())).append("\n");
            plantuml.append("\n");
        }

        plantuml.append("* 方法调用链\n");

        Set<String> level1 = new LinkedHashSet<>();
        Map<String, Set<String>> level2 = new HashMap<>();

        for (FlowNode node : graph.getAllNodes()) {
            if (shouldFilterNode(node)) continue;
            String className = node.getClassName();
            String methodName = node.getMethodName();
            if (className != null && !className.isEmpty()) {
                String simpleClassName = className;
                int lastDot = className.lastIndexOf('.');
                if (lastDot > 0) {
                    simpleClassName = className.substring(lastDot + 1);
                }
                level1.add(simpleClassName);
                if (methodName != null && !methodName.isEmpty()) {
                    level2.computeIfAbsent(simpleClassName, k -> new LinkedHashSet<>()).add(methodName);
                }
            }
        }

        int l1Count = 0;
        for (String cls : level1) {
            plantuml.append("** ").append(cls).append("\n");
            Set<String> methods = level2.get(cls);
            if (methods != null) {
                int l2Count = 0;
                for (String m : methods) {
                    plantuml.append("*** ").append(m).append("\n");
                    l2Count++;
                    if (l2Count >= 3) break;
                }
            }
            l1Count++;
            if (l1Count >= 5) break;
        }

        if (level1.isEmpty()) {
            plantuml.append("** 调用关系分析\n");
        }

        plantuml.append("\n@endwbs\n");
        return plantuml.toString();
    }

    /**
     * 消息信息
     */
    private static class MessageInfo {
        String from;
        String to;
        String note;

        MessageInfo(String from, String to, String note) {
            this.from = from;
            this.to = to;
            this.note = note;
        }
    }
}
