package org.xi.lt.agent.common;

import java.lang.reflect.Method;

public class MdcAdapterUtils {
    private static Method slf4jPutMethod;
    private static Method slf4jRemoveMethod;

    public static void init(ClassLoader cl) {
        if (slf4jPutMethod != null) return;
        try {
            if (cl == null) {
                cl = Thread.currentThread().getContextClassLoader();
            }
            if (cl == null) {
                cl = ClassLoader.getSystemClassLoader();
            }
            Class<?> slf4jMdc = Class.forName("org.slf4j.MDC", false, cl);
            slf4jPutMethod = slf4jMdc.getMethod("put", String.class, String.class);
            slf4jRemoveMethod = slf4jMdc.getMethod("remove", String.class);
        } catch (Throwable t) {
            // Ignore if SLF4J is not available
        }
    }

    public static void put(String key, String val) {
        if (slf4jPutMethod != null) {
            try {
                slf4jPutMethod.invoke(null, key, val);
            } catch (Throwable t) {
                // Ignore
            }
        }
    }

    public static void remove(String key) {
        if (slf4jRemoveMethod != null) {
            try {
                slf4jRemoveMethod.invoke(null, key);
            } catch (Throwable t) {
                // Ignore
            }
        }
    }
}
