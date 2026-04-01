package org.xi.lt.common.utils;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.alibaba.fastjson2.JSONWriter;
import com.alibaba.fastjson2.TypeReference;
import java.util.List;
import java.util.Map;

/**
 * JSON工具类，基于Fastjson2封装
 * 提供JSON序列化、反序列化常用方法
 */
public class JsonUtils {

    private JsonUtils() {
        // 工具类禁止实例化
    }

    /**
     * 对象转为JSON字符串
     * @param obj 目标对象
     * @return JSON字符串
     */
    public static String toJsonString(Object obj) {
        return JSON.toJSONString(obj);
    }

    /**
     * 对象转为带格式的JSON字符串
     * @param obj 目标对象
     * @return 格式化后的JSON字符串
     */
    public static String toJsonStringPretty(Object obj) {
        return JSON.toJSONString(obj, JSONWriter.Feature.PrettyFormat);
    }

    /**
     * JSON字符串转为指定类型对象
     * @param jsonStr JSON字符串
     * @param clazz 目标类型
     * @param <T> 泛型
     * @return 转换后的对象
     */
    public static <T> T parseObject(String jsonStr, Class<T> clazz) {
        return JSON.parseObject(jsonStr, clazz);
    }

    /**
     * JSON字符串转为指定类型对象，支持泛型
     * @param jsonStr JSON字符串
     * @param typeReference 类型引用
     * @param <T> 泛型
     * @return 转换后的对象
     */
    public static <T> T parseObject(String jsonStr, TypeReference<T> typeReference) {
        return JSON.parseObject(jsonStr, typeReference);
    }

    /**
     * JSON字符串转为JSONObject
     * @param jsonStr JSON字符串
     * @return JSONObject对象
     */
    public static JSONObject parseObject(String jsonStr) {
        return JSON.parseObject(jsonStr);
    }

    /**
     * JSON字符串转为指定类型列表
     * @param jsonStr JSON字符串
     * @param clazz 列表元素类型
     * @param <T> 泛型
     * @return 列表对象
     */
    public static <T> List<T> parseArray(String jsonStr, Class<T> clazz) {
        return JSON.parseArray(jsonStr, clazz);
    }

    /**
     * JSON字符串转为Map
     * @param jsonStr JSON字符串
     * @return Map对象
     */
    public static Map<String, Object> parseMap(String jsonStr) {
        return JSON.parseObject(jsonStr, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * 对象转为Map
     * @param obj 目标对象
     * @return Map对象
     */
    public static Map<String, Object> toMap(Object obj) {
        return JSON.parseObject(toJsonString(obj), new TypeReference<Map<String, Object>>() {});
    }

    /**
     * 验证字符串是否为合法JSON格式
     * @param jsonStr 待验证字符串
     * @return true：合法JSON，false：非法JSON
     */
    public static boolean isValidJson(String jsonStr) {
        try {
            JSON.parse(jsonStr);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
