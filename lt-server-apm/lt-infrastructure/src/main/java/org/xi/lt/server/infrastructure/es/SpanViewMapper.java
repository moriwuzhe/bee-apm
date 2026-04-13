package org.xi.lt.server.infrastructure.es;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.xi.lt.server.domain.model.span.SpanView;

public class SpanViewMapper {
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public static SpanView fromSource(Object srcObj) {
        if (srcObj == null) return new SpanView();
        try {
            return MAPPER.convertValue(srcObj, SpanView.class);
        } catch (Exception e) {
            return new SpanView();
        }
    }
}
