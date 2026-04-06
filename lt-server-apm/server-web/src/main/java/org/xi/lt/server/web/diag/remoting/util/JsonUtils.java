package org.xi.lt.server.web.diag.remoting.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonUtils {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static String toJson(Object val) {
        try {
            return MAPPER.writeValueAsString(val);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> T fromJson(byte[] bs, TypeReference<T> type) {
        try {
            return MAPPER.readValue(bs, type);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
