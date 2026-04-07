package org.xi.lt.server.web.api.util;

public class TimeParseUtils {
    public static long parseMillis(String s) {
        if (s == null) return 0;
        String x = s.trim();
        if (x.isEmpty()) return 0;
        try {
            if (x.indexOf('T') > 0) {
                return java.time.Instant.parse(x).toEpochMilli();
            }
            if (x.length() == 19) {
                return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(x).getTime();
            }
            if (x.length() == 16) {
                return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").parse(x).getTime();
            }
            return Long.parseLong(x);
        } catch (Exception e) {
            return 0;
        }
    }

    public static String formatMillis(long ms) {
        if (ms <= 0) return "";
        return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date(ms));
    }
}