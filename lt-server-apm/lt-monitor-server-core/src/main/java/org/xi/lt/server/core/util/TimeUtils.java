package org.xi.lt.server.core.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 时间工具类
 * 提供时间戳转换、日期格式化等常用功能
 * 
 * @author system
 * @date 2026/04/15
 */
public final class TimeUtils {
    
    private static final ZoneId DEFAULT_ZONE = ZoneId.systemDefault();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    private TimeUtils() {
        // 工具类，禁止实例化
    }
    
    /**
     * 将时间戳转换为日期字符串（yyyy-MM-dd格式）
     * 
     * @param timestamp 时间戳（毫秒）
     * @return 日期字符串，如 "2026-04-15"
     */
    public static String timestampToDateStr(Long timestamp) {
        if (timestamp == null) {
            return LocalDate.now(DEFAULT_ZONE).format(DATE_FORMATTER);
        }
        
        // Java 8 兼容方式：Instant -> ZonedDateTime -> LocalDate
        Instant instant = Instant.ofEpochMilli(timestamp);
        LocalDate date = instant.atZone(DEFAULT_ZONE).toLocalDate();
        return date.format(DATE_FORMATTER);
    }
    
    /**
     * 获取当前日期字符串（yyyy-MM-dd格式）
     * 
     * @return 当前日期字符串
     */
    public static String getCurrentDateStr() {
        return LocalDate.now(DEFAULT_ZONE).format(DATE_FORMATTER);
    }
    
    /**
     * 构建基于日期的索引名称
     * 
     * @param prefix 索引前缀，如 "lt-apm-span"
     * @param timestamp 时间戳（毫秒）
     * @return 完整的索引名称，如 "lt-apm-span-2026-04-15"
     */
    public static String buildDateBasedIndexName(String prefix, Long timestamp) {
        return prefix + "-" + timestampToDateStr(timestamp);
    }
}
