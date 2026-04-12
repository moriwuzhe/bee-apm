package org.xi.lt.server.web.shared.util;

import java.util.HashMap;
import java.util.Map;

public final class ApiParamUtils {
    private ApiParamUtils() {
    }

    public static String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    public static int asInt(Object o, int def) {
        if (o == null) return def;
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }

    public static long asLong(Object o, long def) {
        if (o == null) return def;
        if (o instanceof Number) return ((Number) o).longValue();
        try {
            return Long.parseLong(String.valueOf(o));
        } catch (Exception ignored) {
            return def;
        }
    }

    @SuppressWarnings("unchecked")
    public static Object asMap(Object o) {
        if (o instanceof Map) return o;
        return new HashMap();
    }
}
