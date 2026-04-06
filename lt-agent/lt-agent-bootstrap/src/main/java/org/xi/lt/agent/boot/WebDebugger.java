package org.xi.lt.agent.boot;

import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.asm.Advice;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.ClassFileLocator;
import net.bytebuddy.dynamic.DynamicType;
import net.bytebuddy.matcher.ElementMatchers;
import net.bytebuddy.utility.JavaModule;
import net.bytebuddy.implementation.bytecode.assign.Assigner;

import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

public final class WebDebugger {
    private static final Map<String, String> KEY_TO_ID = new ConcurrentHashMap<>();
    private static final Map<String, Watch> ID_TO_WATCH = new ConcurrentHashMap<>();

    private WebDebugger() {
    }

    static String watchAdd(String className, String methodName, int limit) {
        if (className == null || className.trim().isEmpty()) return "ClassNameRequired\n";
        if (methodName == null || methodName.trim().isEmpty()) return "MethodNameRequired\n";
        int n = limit <= 0 ? 50 : Math.min(limit, 500);
        String key = className + "#" + methodName;
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
        Watch watch = new Watch(newId, className, methodName, n);
        KEY_TO_ID.put(key, newId);
        ID_TO_WATCH.put(newId, watch);
        installTransformer(inst, className, methodName);
        int rt = retransformLoaded(inst, className);
        return "OK id=" + newId + " limit=" + n + " retransformed=" + rt + "\n";
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
        KEY_TO_ID.remove(w.className + "#" + w.methodName, id);
        return "OK cleared id=" + id + "\n";
    }

    static String watchList() {
        StringBuilder sb = new StringBuilder();
        sb.append("count=").append(ID_TO_WATCH.size()).append('\n');
        for (Watch w : ID_TO_WATCH.values()) {
            sb.append(w.id).append(' ')
                    .append(w.className).append('#').append(w.methodName)
                    .append(" limit=").append(w.limit)
                    .append(" events=").append(w.counter.get())
                    .append('\n');
        }
        return truncate(sb.toString());
    }

    public static void onEvent(String className, String methodName, String line) {
        if (className == null || methodName == null) return;
        String id = KEY_TO_ID.get(className + "#" + methodName);
        if (id == null) {
            int idx = className.indexOf("$$");
            if (idx > 0) {
                String base = className.substring(0, idx);
                id = KEY_TO_ID.get(base + "#" + methodName);
            }
        }
        if (id == null) return;
        Watch w = ID_TO_WATCH.get(id);
        if (w == null) return;
        w.events.add(line);
        w.counter.incrementAndGet();
        while (w.events.size() > w.limit) {
            w.events.poll();
        }
    }

    private static void installTransformer(Instrumentation inst, String className, String methodName) {
        final ClassFileLocator locator = ClassFileLocator.ForClassLoader.of(WebDebugger.class.getClassLoader());
        AgentBuilder builder = new AgentBuilder.Default()
                .with(AgentBuilder.RedefinitionStrategy.RETRANSFORMATION)
                .disableClassFormatChanges()
                .ignore(ElementMatchers.none())
                .type(ElementMatchers.named(className).or(ElementMatchers.hasSuperType(ElementMatchers.named(className))))
                .transform(new AgentBuilder.Transformer() {
                    @Override
                    public DynamicType.Builder<?> transform(DynamicType.Builder<?> b, TypeDescription td, ClassLoader cl, JavaModule jm, ProtectionDomain pd) {
                        return b.visit(Advice.to(WatchAdvice.class, locator).on(ElementMatchers.named(methodName)));
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
                        WebDebugger.onEvent(className, methodName, "TRANSFORM_ERROR type=" + typeName + " error=" + shortStr(throwable));
                    }

                    @Override
                    public void onComplete(String typeName, ClassLoader classLoader, JavaModule module, boolean loaded) {
                    }
                })
                .installOn(inst);
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
                            @Advice.AllArguments Object[] args) {
            String thread = Thread.currentThread().getName();
            String a = toShortArgs(args);
            WebDebugger.onEvent(cls, m, "ENTER thread=" + thread + " args=" + a);
            return System.nanoTime();
        }

        @Advice.OnMethodExit(onThrowable = Throwable.class)
        static void onExit(@Advice.Origin("#t") String cls,
                           @Advice.Origin("#m") String m,
                           @Advice.Enter long startNs,
                           @Advice.Return(typing = Assigner.Typing.DYNAMIC) Object ret,
                           @Advice.Thrown Throwable t) {
            long costMs = (System.nanoTime() - startNs) / 1_000_000;
            if (t != null) {
                WebDebugger.onEvent(cls, m, "EXIT costMs=" + costMs + " thrown=" + shortStr(t));
            } else {
                WebDebugger.onEvent(cls, m, "EXIT costMs=" + costMs + " ret=" + shortStr(ret));
            }
        }
    }

    static final class Watch {
        final String id;
        final String className;
        final String methodName;
        final ConcurrentLinkedQueue<String> events = new ConcurrentLinkedQueue<>();
        final AtomicInteger counter = new AtomicInteger();
        volatile int limit;

        Watch(String id, String className, String methodName, int limit) {
            this.id = id;
            this.className = className;
            this.methodName = methodName;
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
        String s;
        try {
            s = String.valueOf(o);
        } catch (Throwable t) {
            s = o.getClass().getName();
        }
        if (s.length() > 300) return s.substring(0, 300) + "...";
        return s;
    }

    public static String truncate(String s) {
        if (s == null) return "";
        if (s.length() <= 8000) return s;
        return s.substring(0, 8000) + "\n...truncated\n";
    }
}

