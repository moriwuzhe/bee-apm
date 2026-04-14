package org.xi.lt.common.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.util.List;
import java.util.Map;

/**
 * JSON工具类，基于Jackson封装
 * 提供JSON序列化、反序列化常用方法
 */
public class JsonUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    static {
        // 配置ObjectMapper
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        OBJECT_MAPPER.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
    }

    private JsonUtils() {
        // 工具类禁止实例化
    }

    /**
     * 对象转为JSON字符串
     * @param obj 目标对象
     * @return JSON字符串
     */
    public static String toJsonString(Object obj) {
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    /**
     * 对象转为带格式的JSON字符串
     * @param obj 目标对象
     * @return 格式化后的JSON字符串
     */
    public static String toJsonStringPretty(Object obj) {
        try {
            return OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    /**
     * JSON字符串转为指定类型对象
     * @param jsonStr JSON字符串
     * @param clazz 目标类型
     * @param <T> 泛型
     * @return 转换后的对象
     */
    public static <T> T parseObject(String jsonStr, Class<T> clazz) {
        try {
            return OBJECT_MAPPER.readValue(jsonStr, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON反序列化失败", e);
        }
    }

    /**
     * JSON字符串转为指定类型对象，支持泛型
     * @param jsonStr JSON字符串
     * @param typeReference 类型引用
     * @param <T> 泛型
     * @return 转换后的对象
     */
    public static <T> T parseObject(String jsonStr, TypeReference<T> typeReference) {
        try {
            return OBJECT_MAPPER.readValue(jsonStr, typeReference);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON反序列化失败", e);
        }
    }

    /**
     * JSON字符串转为Map
     * @param jsonStr JSON字符串
     * @return Map对象
     */
    public static Map<String, Object> parseMap(String jsonStr) {
        try {
            return OBJECT_MAPPER.readValue(jsonStr, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON反序列化失败", e);
        }
    }

    /**
     * 对象转为Map
     * @param obj 目标对象
     * @return Map对象
     */
    public static Map<String, Object> toMap(Object obj) {
        return OBJECT_MAPPER.convertValue(obj, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * 验证字符串是否为合法JSON格式
     * @param jsonStr 待验证字符串
     * @return true：合法JSON，false：非法JSON
     */
    public static boolean isValidJson(String jsonStr) {
        try {
            OBJECT_MAPPER.readTree(jsonStr);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * JSON字符串转为指定类型列表
     * @param jsonStr JSON字符串
     * @param clazz 列表元素类型
     * @param <T> 泛型
     * @return 列表对象
     */
    public static <T> List<T> parseArray(String jsonStr, Class<T> clazz) {
        try {
            return OBJECT_MAPPER.readValue(jsonStr, 
                OBJECT_MAPPER.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON反序列化失败", e);
        }
    }
}
