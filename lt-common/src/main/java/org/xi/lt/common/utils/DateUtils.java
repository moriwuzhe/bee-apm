package org.xi.lt.common.utils;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * 日期工具类，基于Java 8+新时间API封装
 * 线程安全，性能优于SimpleDateFormat
 */
public class DateUtils {

    private DateUtils() {
        // 工具类禁止实例化
    }

    // 常用日期格式
    public static final String YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";
    public static final String YYYY_MM_DD = "yyyy-MM-dd";
    public static final String HH_MM_SS = "HH:mm:ss";
    public static final String YYYYMMDDHHMMSS = "yyyyMMddHHmmss";
    public static final String YYYYMMDD = "yyyyMMdd";

    // 线程安全的DateTimeFormatter
    public static final DateTimeFormatter FORMATTER_YMDHMS = DateTimeFormatter.ofPattern(YYYY_MM_DD_HH_MM_SS);
    public static final DateTimeFormatter FORMATTER_YMD = DateTimeFormatter.ofPattern(YYYY_MM_DD);
    public static final DateTimeFormatter FORMATTER_HMS = DateTimeFormatter.ofPattern(HH_MM_SS);
    public static final DateTimeFormatter FORMATTER_COMPACT_YMDHMS = DateTimeFormatter.ofPattern(YYYYMMDDHHMMSS);
    public static final DateTimeFormatter FORMATTER_COMPACT_YMD = DateTimeFormatter.ofPattern(YYYYMMDD);

    // ====================== 当前时间获取 ======================
    /**
     * 获取当前时间戳（毫秒）
     * @return 毫秒时间戳
     */
    public static long currentTimeMillis() {
        return System.currentTimeMillis();
    }

    /**
     * 获取当前时间戳（秒）
     * @return 秒级时间戳
     */
    public static long currentTimeSeconds() {
        return System.currentTimeMillis() / 1000;
    }

    /**
     * 获取当前LocalDateTime
     * @return LocalDateTime对象
     */
    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    /**
     * 获取当前日期字符串，格式：yyyy-MM-dd HH:mm:ss
     * @return 日期字符串
     */
    public static String nowStr() {
        return format(now(), YYYY_MM_DD_HH_MM_SS);
    }

    // ====================== 日期格式化 ======================
    /**
     * LocalDateTime格式化为指定格式字符串
     * @param dateTime LocalDateTime对象
     * @param pattern 格式
     * @return 格式化后的字符串
     */
    public static String format(LocalDateTime dateTime, String pattern) {
        return dateTime.format(DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * LocalDateTime格式化为yyyy-MM-dd HH:mm:ss
     * @param dateTime LocalDateTime对象
     * @return 格式化后的字符串
     */
    public static String formatYmdHms(LocalDateTime dateTime) {
        return dateTime.format(FORMATTER_YMDHMS);
    }

    /**
     * Date格式化为指定格式字符串
     * @param date Date对象
     * @param pattern 格式
     * @return 格式化后的字符串
     */
    public static String format(Date date, String pattern) {
        return format(toLocalDateTime(date), pattern);
    }

    /**
     * 时间戳（毫秒）格式化为指定格式字符串
     * @param timestamp 毫秒时间戳
     * @param pattern 格式
     * @return 格式化后的字符串
     */
    public static String format(long timestamp, String pattern) {
        return format(toLocalDateTime(timestamp), pattern);
    }

    // ====================== 日期解析 ======================
    /**
     * 字符串解析为LocalDateTime
     * @param dateStr 日期字符串
     * @param pattern 格式
     * @return LocalDateTime对象
     */
    public static LocalDateTime parse(String dateStr, String pattern) {
        return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * 字符串解析为LocalDate
     * @param dateStr 日期字符串
     * @param pattern 格式
     * @return LocalDate对象
     */
    public static LocalDate parseDate(String dateStr, String pattern) {
        return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * 字符串解析为Date
     * @param dateStr 日期字符串
     * @param pattern 格式
     * @return Date对象
     */
    public static Date parseToDate(String dateStr, String pattern) {
        return toDate(parse(dateStr, pattern));
    }

    // ====================== 类型转换 ======================
    /**
     * Date转LocalDateTime
     * @param date Date对象
     * @return LocalDateTime对象
     */
    public static LocalDateTime toLocalDateTime(Date date) {
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }

    /**
     * 毫秒时间戳转LocalDateTime
     * @param timestamp 毫秒时间戳
     * @return LocalDateTime对象
     */
    public static LocalDateTime toLocalDateTime(long timestamp) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
    }

    /**
     * LocalDateTime转Date
     * @param dateTime LocalDateTime对象
     * @return Date对象
     */
    public static Date toDate(LocalDateTime dateTime) {
        return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    /**
     * LocalDateTime转毫秒时间戳
     * @param dateTime LocalDateTime对象
     * @return 毫秒时间戳
     */
    public static long toTimestamp(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    // ====================== 日期计算 ======================
    /**
     * 计算两个时间的间隔
     * @param start 开始时间
     * @param end 结束时间
     * @param unit 时间单位
     * @return 间隔值
     */
    public static long between(LocalDateTime start, LocalDateTime end, ChronoUnit unit) {
        return unit.between(start, end);
    }

    /**
     * 获取指定时间的开始时间（当天00:00:00）
     * @param dateTime 目标时间
     * @return 当天开始时间
     */
    public static LocalDateTime getDayStart(LocalDateTime dateTime) {
        return dateTime.with(LocalTime.MIN);
    }

    /**
     * 获取指定时间的结束时间（当天23:59:59.999）
     * @param dateTime 目标时间
     * @return 当天结束时间
     */
    public static LocalDateTime getDayEnd(LocalDateTime dateTime) {
        return dateTime.with(LocalTime.MAX);
    }

    /**
     * 判断时间是否在指定范围内
     * @param target 目标时间
     * @param start 开始时间
     * @param end 结束时间
     * @return true：在范围内，false：不在范围内
     */
    public static boolean isBetween(LocalDateTime target, LocalDateTime start, LocalDateTime end) {
        return !target.isBefore(start) && !target.isAfter(end);
    }
}
