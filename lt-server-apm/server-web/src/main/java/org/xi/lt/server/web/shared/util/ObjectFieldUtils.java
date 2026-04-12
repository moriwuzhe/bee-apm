package org.xi.lt.server.web.shared.util;

public class ObjectFieldUtils {
    public static Object get(Object obj, String key) {
        if (obj == null || key == null) return null;
        if (obj instanceof java.util.Map) {
            return ((java.util.Map) obj).get(key);
        }
        return null;
    }

    public static String getString(Object obj, String key) {
        Object v = get(obj, key);
        return v == null ? "" : String.valueOf(v);
    }

    public static long getLong(Object obj, String key) {
        Object v = get(obj, key);
        if (v == null) return 0;
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (Exception e) {
            return 0;
        }
    }
}
