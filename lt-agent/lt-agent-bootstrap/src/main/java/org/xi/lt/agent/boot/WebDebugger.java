package org.xi.lt.agent.boot;

import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.asm.Advice;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.ClassFileLocator;
import net.bytebuddy.dynamic.DynamicType;
import net.bytebuddy.matcher.ElementMatchers;
import net.bytebuddy.utility.JavaModule;
import net.bytebuddy.implementation.bytecode.assign.Assigner;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

public final class WebDebugger {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Map<String, String> KEY_TO_ID = new ConcurrentHashMap<>();
    private static final Map<String, Watch> ID_TO_WATCH = new ConcurrentHashMap<>();
    private static final Map<String, CopyOnWriteArrayList<String>> KEY_TO_DEBUG_IDS = new ConcurrentHashMap<>();
    private static final Map<String, DebugPoint> ID_TO_DEBUG = new ConcurrentHashMap<>();
    private static final int WHEN_ENTER = 1;
    private static final int WHEN_EXIT = 2;
    private static final int WHEN_THROW = 3;

    private WebDebugger() {
    }

    static String watchAdd(String className, String methodName, String paramTypes, int limit) {
        if (className == null || className.trim().isEmpty()) return "ClassNameRequired\n";
        if (methodName == null || methodName.trim().isEmpty()) return "MethodNameRequired\n";
        int n = limit <= 0 ? 50 : Math.min(limit, 500);
        String paramPart = toParamPart(paramTypes);
        String key = makeKey(className, methodName, paramPart);
        String id = KEY_TO_ID.get(key);
        if (id != null) {
            Watch w = ID_TO_WATCH.get(id);
            if (w != null) {
                w.limit = n;
                return "OK id=" + id + " updated limit=" + n + "\n";
            }
        }
        Instrumentation inst = LtAgent.getInstrumentation();
        if (inst == null) return "InstrumentationNotReady\n";
        String newId = UUID.randomUUID().toString().replace("-", "");
        Watch watch = new Watch(newId, className, methodName, paramTypes, paramPart, n);
        KEY_TO_ID.put(key, newId);
        ID_TO_WATCH.put(newId, watch);
        installTransformer(inst, className, methodName, paramTypes);
        int rt = retransformLoaded(inst, className);
        return "OK id=" + newId + " limit=" + n + " paramTypes=" + (paramTypes == null ? "" : paramTypes) + " retransformed=" + rt + "\n";
    }

    static String watchDump(String id, int maxLines) {
        Watch w = ID_TO_WATCH.get(id);
        if (w == null) return "NotFound id=" + id + "\n";
        int n = maxLines <= 0 ? 200 : Math.min(maxLines, 2000);
        List<String> lines = new ArrayList<>(n);
        for (String s : w.events) {
            lines.add(s);
            if (lines.size() >= n) break;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("id=").append(w.id).append('\n');
        sb.append("class=").append(w.className).append('\n');
        sb.append("method=").append(w.methodName).append('\n');
        sb.append("paramTypes=").append(w.paramTypes).append('\n');
        sb.append("paramDesc=").append(w.paramPart).append('\n');
        sb.append("limit=").append(w.limit).append('\n');
        sb.append("events=").append(w.counter.get()).append('\n');
        sb.append('\n');
        for (String line : lines) {
            sb.append(line).append('\n');
        }
        return truncate(sb.toString());
    }

    static String watchClear(String id) {
        Watch w = ID_TO_WATCH.remove(id);
        if (w == null) return "NotFound id=" + id + "\n";
        KEY_TO_ID.remove(makeKey(w.className, w.methodName, w.paramPart), id);
        return "OK cleared id=" + id + "\n";
    }

    static String watchList() {
        StringBuilder sb = new StringBuilder();
        sb.append("count=").append(ID_TO_WATCH.size()).append('\n');
        for (Watch w : ID_TO_WATCH.values()) {
            sb.append(w.id).append(' ')
                    .append(w.className).append('#').append(w.methodName)
                    .append(w.paramTypes.isEmpty() ? "" : "(" + w.paramTypes + ")")
                    .append(" limit=").append(w.limit)
                    .append(" events=").append(w.counter.get())
                    .append('\n');
        }
        return truncate(sb.toString());
    }

    static String debugAdd(String className, String methodName, String when, String paramTypes, int limit, int stackDepth, String contains) {
        if (className == null || className.trim().isEmpty()) return "ClassNameRequired\n";
        if (methodName == null || methodName.trim().isEmpty()) return "MethodNameRequired\n";
        int w = parseWhen(when);
        if (w == 0) return "WhenInvalid\n";
        int n = limit <= 0 ? 20 : Math.min(limit, 500);
        int sd = stackDepth < 0 ? 0 : Math.min(stackDepth, 60);
        String filter = contains == null ? "" : contains.trim();
        Instrumentation inst = LtAgent.getInstrumentation();
        if (inst == null) return "InstrumentationNotReady\n";
        String id = UUID.randomUUID().toString().replace("-", "");
        String paramPart = toParamPart(paramTypes);
        DebugPoint dp = new DebugPoint(id, className, methodName, paramTypes, paramPart, w, n, sd, filter);
        ID_TO_DEBUG.put(id, dp);
        KEY_TO_DEBUG_IDS.computeIfAbsent(makeKey(className, methodName, paramPart), k -> new CopyOnWriteArrayList<>()).add(id);
        installDebugTransformer(inst, className, methodName, paramTypes);
        int rt = retransformLoaded(inst, className);
        return "OK id=" + id + " when=" + whenName(w) + " limit=" + n + " stackDepth=" + sd + " paramTypes=" + (paramTypes == null ? "" : paramTypes) + " retransformed=" + rt + "\n";
    }

    static String debugDump(String id, int maxLines) {
        DebugPoint dp = ID_TO_DEBUG.get(id);
        if (dp == null) return "NotFound id=" + id + "\n";
        int n = maxLines <= 0 ? 200 : Math.min(maxLines, 2000);
        List<String> lines = new ArrayList<>(n);
        for (String s : dp.events) {
            lines.add(s);
            if (lines.size() >= n) break;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("id=").append(dp.id).append('\n');
        sb.append("class=").append(dp.className).append('\n');
        sb.append("method=").append(dp.methodName).append('\n');
        sb.append("paramTypes=").append(dp.paramTypes).append('\n');
        sb.append("paramDesc=").append(dp.paramPart).append('\n');
        sb.append("when=").append(whenName(dp.when)).append('\n');
        sb.append("limit=").append(dp.limit).append('\n');
        sb.append("stackDepth=").append(dp.stackDepth).append('\n');
        sb.append("contains=").append(dp.contains).append('\n');
        sb.append("events=").append(dp.counter.get()).append('\n');
        sb.append('\n');
        for (String line : lines) {
            sb.append(line).append('\n');
        }
        return truncate(sb.toString());
    }

    static String debugClear(String id) {
        DebugPoint dp = ID_TO_DEBUG.remove(id);
        if (dp == null) return "NotFound id=" + id + "\n";
        String key = makeKey(dp.className, dp.methodName, dp.paramPart);
        CopyOnWriteArrayList<String> ids = KEY_TO_DEBUG_IDS.get(key);
        if (ids != null) {
            ids.remove(id);
            if (ids.isEmpty()) KEY_TO_DEBUG_IDS.remove(key, ids);
        }
        return "OK cleared id=" + id + "\n";
    }

    static String debugList() {
        StringBuilder sb = new StringBuilder();
        sb.append("count=").append(ID_TO_DEBUG.size()).append('\n');
        for (DebugPoint dp : ID_TO_DEBUG.values()) {
            sb.append(dp.id).append(' ')
                    .append(dp.className).append('#').append(dp.methodName)
                    .append(dp.paramTypes.isEmpty() ? "" : "(" + dp.paramTypes + ")")
                    .append(" when=").append(whenName(dp.when))
                    .append(" limit=").append(dp.limit)
                    .append(" stackDepth=").append(dp.stackDepth)
                    .append(" events=").append(dp.counter.get())
                    .append('\n');
        }
        return truncate(sb.toString());
    }

    public static void onEvent(String className, String methodName, String methodDesc, String line) {
        if (className == null || methodName == null) return;
        String keyBase = normalizeKeyBase(className, methodName);
        String paramPart = paramPartFromDesc(methodDesc);
        String id = KEY_TO_ID.get(keyBase + paramPart);
        if (id == null) id = KEY_TO_ID.get(keyBase);
        if (id == null) return;
        Watch w = ID_TO_WATCH.get(id);
        if (w == null) return;
        w.events.add(line);
        w.counter.incrementAndGet();
        while (w.events.size() > w.limit) {
            w.events.poll();
        }
    }

    public static void onDebug(String className, String methodName, String methodDesc, int when, String line) {
        if (className == null || methodName == null || when == 0) return;
        String keyBase = normalizeKeyBase(className, methodName);
        String paramPart = paramPartFromDesc(methodDesc);
        CopyOnWriteArrayList<String> ids = KEY_TO_DEBUG_IDS.get(keyBase + paramPart);
        if (ids == null || ids.isEmpty()) ids = KEY_TO_DEBUG_IDS.get(keyBase);
        if (ids == null || ids.isEmpty()) return;
        for (String id : ids) {
            DebugPoint dp = ID_TO_DEBUG.get(id);
            if (dp == null) continue;
            if (dp.when != when) continue;
            if (!dp.accepts(line)) continue;
            dp.events.add(line);
            dp.counter.incrementAndGet();
            while (dp.events.size() > dp.limit) {
                dp.events.poll();
            }
        }
    }

    private static String normalizeKeyBase(String className, String methodName) {
        int idx = className.indexOf("$$");
        String c = idx > 0 ? className.substring(0, idx) : className;
        return c + "#" + methodName + "#";
    }

    private static String makeKey(String className, String methodName, String paramPart) {
        return className + "#" + methodName + "#" + (paramPart == null ? "" : paramPart);
    }

    private static String toParamPart(String paramTypes) {
        if (paramTypes == null) return "";
        String x = paramTypes.trim();
        if (x.isEmpty()) return "";
        if (x.startsWith("(") && x.indexOf(')') > 0 && (x.indexOf('/') >= 0 || x.indexOf('L') >= 0)) {
            int end = x.indexOf(')') + 1;
            return x.substring(0, end);
        }
        String[] pts = splitParamTypes(x);
        if (pts == null) return "";
        StringBuilder sb = new StringBuilder();
        sb.append('(');
        for (String p : pts) {
            sb.append(toJvmTypeDesc(p));
        }
        sb.append(')');
        return sb.toString();
    }

    private static String toJvmTypeDesc(String javaType) {
        if (javaType == null) return "Ljava/lang/Object;";
        String t = javaType.trim();
        if (t.isEmpty()) return "Ljava/lang/Object;";
        int dims = 0;
        while (t.endsWith("[]")) {
            dims++;
            t = t.substring(0, t.length() - 2).trim();
        }
        String base;
        if ("boolean".equals(t)) base = "Z";
        else if ("byte".equals(t)) base = "B";
        else if ("char".equals(t)) base = "C";
        else if ("short".equals(t)) base = "S";
        else if ("int".equals(t)) base = "I";
        else if ("long".equals(t)) base = "J";
        else if ("float".equals(t)) base = "F";
        else if ("double".equals(t)) base = "D";
        else base = "L" + t.replace('.', '/') + ";";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < dims; i++) sb.append('[');
        sb.append(base);
        return sb.toString();
    }

    private static String paramPartFromDesc(String desc) {
        if (desc == null || desc.isEmpty()) return "";
        int end = desc.indexOf(')');
        if (end < 0) return "";
        return desc.substring(0, end + 1);
    }

    private static int parseWhen(String s) {
        if (s == null) return 0;
        String x = s.trim().toUpperCase();
        if ("ENTER".equals(x)) return WHEN_ENTER;
        if ("EXIT".equals(x)) return WHEN_EXIT;
        if ("THROW".equals(x) || "THROWN".equals(x)) return WHEN_THROW;
        return 0;
    }

    private static String whenName(int when) {
        if (when == WHEN_ENTER) return "ENTER";
        if (when == WHEN_EXIT) return "EXIT";
        if (when == WHEN_THROW) return "THROW";
        return "UNKNOWN";
    }

    private static void installTransformer(Instrumentation inst, String className, String methodName, String paramTypes) {
        final ClassFileLocator locator = ClassFileLocator.ForClassLoader.of(WebDebugger.class.getClassLoader());
        net.bytebuddy.matcher.ElementMatcher.Junction methodMatcher = ElementMatchers.named(methodName);
        String[] pts = splitParamTypes(paramTypes);
        if (pts != null) {
            net.bytebuddy.matcher.ElementMatcher.Junction mm = methodMatcher.and(ElementMatchers.takesArguments(pts.length));
            for (int i = 0; i < pts.length; i++) {
                mm = mm.and(ElementMatchers.takesArgument(i, ElementMatchers.named(pts[i])));
            }
            methodMatcher = mm;
        }
        final net.bytebuddy.matcher.ElementMatcher.Junction methodMatcherFinal = methodMatcher;
        AgentBuilder builder = new AgentBuilder.Default()
                .with(AgentBuilder.RedefinitionStrategy.RETRANSFORMATION)
                .disableClassFormatChanges()
                .ignore(ElementMatchers.none())
                .type(ElementMatchers.named(className).or(ElementMatchers.hasSuperType(ElementMatchers.named(className))))
                .transform(new AgentBuilder.Transformer() {
                    @Override
                    public DynamicType.Builder<?> transform(DynamicType.Builder<?> b, TypeDescription td, ClassLoader cl, JavaModule jm, ProtectionDomain pd) {
                        return b.visit(Advice.to(WatchAdvice.class, locator).on(methodMatcherFinal));
                    }
                });
        builder.with(new AgentBuilder.Listener() {
                    @Override
                    public void onDiscovery(String typeName, ClassLoader classLoader, JavaModule module, boolean loaded) {
                    }

                    @Override
                    public void onTransformation(TypeDescription typeDescription, ClassLoader classLoader, JavaModule module, boolean loaded, DynamicType dynamicType) {
                    }

                    @Override
                    public void onIgnored(TypeDescription typeDescription, ClassLoader classLoader, JavaModule module, boolean loaded) {
                    }

                    @Override
                    public void onError(String typeName, ClassLoader classLoader, JavaModule module, boolean loaded, Throwable throwable) {
                        WebDebugger.onEvent(className, methodName, "", "TRANSFORM_ERROR type=" + typeName + " error=" + shortStr(throwable));
                    }

                    @Override
                    public void onComplete(String typeName, ClassLoader classLoader, JavaModule module, boolean loaded) {
                    }
                })
                .installOn(inst);
    }

    private static void installDebugTransformer(Instrumentation inst, String className, String methodName, String paramTypes) {
        final ClassFileLocator locator = ClassFileLocator.ForClassLoader.of(WebDebugger.class.getClassLoader());
        net.bytebuddy.matcher.ElementMatcher.Junction methodMatcher = ElementMatchers.named(methodName);
        String[] pts = splitParamTypes(paramTypes);
        if (pts != null) {
            net.bytebuddy.matcher.ElementMatcher.Junction mm = methodMatcher.and(ElementMatchers.takesArguments(pts.length));
            for (int i = 0; i < pts.length; i++) {
                mm = mm.and(ElementMatchers.takesArgument(i, ElementMatchers.named(pts[i])));
            }
            methodMatcher = mm;
        }
        final net.bytebuddy.matcher.ElementMatcher.Junction methodMatcherFinal = methodMatcher;
        new AgentBuilder.Default()
                .with(AgentBuilder.RedefinitionStrategy.RETRANSFORMATION)
                .disableClassFormatChanges()
                .ignore(ElementMatchers.none())
                .type(ElementMatchers.named(className).or(ElementMatchers.hasSuperType(ElementMatchers.named(className))))
                .transform(new AgentBuilder.Transformer() {
                    @Override
                    public DynamicType.Builder<?> transform(DynamicType.Builder<?> b, TypeDescription td, ClassLoader cl, JavaModule jm, ProtectionDomain pd) {
                        return b.visit(Advice.to(WebDebugger.class, locator).on(methodMatcherFinal));
                    }
                })
                .installOn(inst);
    }

    private static String[] splitParamTypes(String paramTypes) {
        if (paramTypes == null) return null;
        String x = paramTypes.trim();
        if (x.isEmpty()) return null;
        String[] parts = x.split(",");
        List<String> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            if (p == null) continue;
            String t = p.trim();
            if (t.isEmpty()) continue;
            out.add(t);
        }
        if (out.isEmpty()) return null;
        return out.toArray(new String[0]);
    }

    private static int retransformLoaded(Instrumentation inst, String className) {
        int n = 0;
        try {
            Class<?>[] loaded = inst.getAllLoadedClasses();
            if (loaded == null) return 0;
            for (Class<?> c : loaded) {
                if (c == null) continue;
                if (!inst.isModifiableClass(c)) continue;
                if (matchesClassOrSubclass(c, className)) {
                    try {
                        inst.retransformClasses(c);
                        n++;
                    } catch (Throwable ignored) {
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return n;
    }

    private static boolean matchesClassOrSubclass(Class<?> c, String className) {
        if (c == null || className == null) return false;
        if (className.equals(c.getName())) return true;
        Class<?> x = c.getSuperclass();
        int depth = 0;
        while (x != null && depth < 15) {
            if (className.equals(x.getName())) return true;
            x = x.getSuperclass();
            depth++;
        }
        return false;
    }

    static final class WatchAdvice {
        @Advice.OnMethodEnter
        static long onEnter(@Advice.Origin("#t") String cls,
                            @Advice.Origin("#m") String m,
                            @Advice.Origin("#d") String d,
                            @Advice.AllArguments Object[] args) {
            String thread = Thread.currentThread().getName();
            String a = toShortArgs(args);
            WebDebugger.onEvent(cls, m, d, "ENTER thread=" + thread + " args=" + a);
            return System.nanoTime();
        }

        @Advice.OnMethodExit(onThrowable = Throwable.class)
        static void onExit(@Advice.Origin("#t") String cls,
                           @Advice.Origin("#m") String m,
                           @Advice.Origin("#d") String d,
                           @Advice.Enter long startNs,
                           @Advice.Return(typing = Assigner.Typing.DYNAMIC) Object ret,
                           @Advice.Thrown Throwable t) {
            long costMs = (System.nanoTime() - startNs) / 1_000_000;
            if (t != null) {
                WebDebugger.onEvent(cls, m, d, "EXIT costMs=" + costMs + " thrown=" + shortStr(t));
            } else {
                WebDebugger.onEvent(cls, m, d, "EXIT costMs=" + costMs + " ret=" + shortStr(ret));
            }
        }
    }

    @Advice.OnMethodEnter
    static long debugEnter(@Advice.Origin("#t") String cls,
                           @Advice.Origin("#m") String m,
                           @Advice.Origin("#d") String d,
                           @Advice.AllArguments Object[] args) {
        String thread = Thread.currentThread().getName();
        String a = toShortArgs(args);
        WebDebugger.onDebug(cls, m, d, WHEN_ENTER, "ENTER thread=" + thread + " args=" + a);
        return System.nanoTime();
    }

    @Advice.OnMethodExit(onThrowable = Throwable.class)
    static void debugExit(@Advice.Origin("#t") String cls,
                          @Advice.Origin("#m") String m,
                          @Advice.Origin("#d") String d,
                          @Advice.Enter long startNs,
                          @Advice.AllArguments Object[] args,
                          @Advice.Return(typing = Assigner.Typing.DYNAMIC) Object ret,
                          @Advice.Thrown Throwable t) {
        long costMs = (System.nanoTime() - startNs) / 1_000_000;
        String thread = Thread.currentThread().getName();
        String a = toShortArgs(args);
        if (t != null) {
            WebDebugger.onDebug(cls, m, d, WHEN_THROW, "THROW thread=" + thread + " costMs=" + costMs + " args=" + a + " thrown=" + shortStr(t) + debugStackSuffix(cls, m, d));
        } else {
            WebDebugger.onDebug(cls, m, d, WHEN_EXIT, "EXIT thread=" + thread + " costMs=" + costMs + " args=" + a + " ret=" + shortStr(ret) + debugStackSuffix(cls, m, d));
        }
    }

    public static String debugStackSuffix(String cls, String m, String d) {
        String keyBase = normalizeKeyBase(cls, m);
        String paramPart = paramPartFromDesc(d);
        CopyOnWriteArrayList<String> ids = KEY_TO_DEBUG_IDS.get(keyBase + paramPart);
        if (ids == null || ids.isEmpty()) ids = KEY_TO_DEBUG_IDS.get(keyBase);
        if (ids == null || ids.isEmpty()) return "";
        int maxDepth = 0;
        for (String id : ids) {
            DebugPoint dp = ID_TO_DEBUG.get(id);
            if (dp == null) continue;
            if (dp.stackDepth > maxDepth) maxDepth = dp.stackDepth;
        }
        if (maxDepth <= 0) return "";
        StackTraceElement[] st = Thread.currentThread().getStackTrace();
        StringBuilder sb = new StringBuilder();
        sb.append("\nSTACK\n");
        int start = 0;
        for (int i = 0; i < st.length; i++) {
            String cn = st[i].getClassName();
            if (cn != null && cn.startsWith("org.xi.lt.agent.boot.")) {
                start = i + 1;
            }
        }
        int count = 0;
        for (int i = start; i < st.length && count < maxDepth; i++) {
            sb.append("  at ").append(st[i].toString()).append('\n');
            count++;
        }
        return sb.toString();
    }

    static final class DebugPoint {
        final String id;
        final String className;
        final String methodName;
        final String paramTypes;
        final String paramPart;
        final int when;
        final ConcurrentLinkedQueue<String> events = new ConcurrentLinkedQueue<>();
        final AtomicInteger counter = new AtomicInteger();
        final int limit;
        final int stackDepth;
        final String contains;

        DebugPoint(String id, String className, String methodName, String paramTypes, String paramPart, int when, int limit, int stackDepth, String contains) {
            this.id = id;
            this.className = className;
            this.methodName = methodName;
            this.paramTypes = paramTypes == null ? "" : paramTypes;
            this.paramPart = paramPart == null ? "" : paramPart;
            this.when = when;
            this.limit = limit;
            this.stackDepth = stackDepth;
            this.contains = contains == null ? "" : contains;
        }

        boolean accepts(String line) {
            if (contains == null || contains.isEmpty()) return true;
            return line != null && line.contains(contains);
        }
    }

    static final class Watch {
        final String id;
        final String className;
        final String methodName;
        final String paramTypes;
        final String paramPart;
        final ConcurrentLinkedQueue<String> events = new ConcurrentLinkedQueue<>();
        final AtomicInteger counter = new AtomicInteger();
        volatile int limit;

        Watch(String id, String className, String methodName, String paramTypes, String paramPart, int limit) {
            this.id = id;
            this.className = className;
            this.methodName = methodName;
            this.paramTypes = paramTypes == null ? "" : paramTypes;
            this.paramPart = paramPart == null ? "" : paramPart;
            this.limit = limit;
        }
    }

    public static String toShortArgs(Object[] args) {
        if (args == null || args.length == 0) return "[]";
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        int n = Math.min(args.length, 10);
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(", ");
            sb.append(shortStr(args[i]));
        }
        if (args.length > n) sb.append(", ...");
        sb.append(']');
        return sb.toString();
    }

    public static String shortStr(Object o) {
        if (o == null) return "null";
        if (o instanceof Throwable) {
            Throwable t = (Throwable) o;
            String msg = t.getMessage();
            String base = t.getClass().getName();
            String s = msg == null || msg.isEmpty() ? base : (base + ": " + msg);
            if (s.length() > 500) return s.substring(0, 500) + "...";
            return s;
        }
        if (o instanceof CharSequence || o instanceof Number || o instanceof Boolean || o instanceof Enum) {
            String s = String.valueOf(o);
            if (s.length() > 500) return s.substring(0, 500) + "...";
            return s;
        }
        String s;
        try {
            s = OBJECT_MAPPER.writeValueAsString(o);
        } catch (Throwable t) {
            try {
                s = String.valueOf(o);
            } catch (Throwable ignored) {
                s = o.getClass().getName();
            }
        }
        if (s.length() > 500) return s.substring(0, 500) + "...";
        return s;
    }

    public static String truncate(String s) {
        if (s == null) return "";
        if (s.length() <= 8000) return s;
        return s.substring(0, 8000) + "\n...truncated\n";
    }
}

