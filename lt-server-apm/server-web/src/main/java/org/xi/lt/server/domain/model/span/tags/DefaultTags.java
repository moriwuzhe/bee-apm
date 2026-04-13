package org.xi.lt.server.domain.model.span.tags;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DefaultTags extends SpanTags {
    private Map<String, Object> others = new LinkedHashMap<>();

    @JsonAnyGetter
    public Map<String, Object> getOthers() {
        return others;
    }

    @JsonAnySetter
    public void setOther(String name, Object value) {
        others.put(name, value);
    }
}
