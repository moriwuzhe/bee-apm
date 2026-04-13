package org.xi.lt.server.domain.model.span.tags;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXTERNAL_PROPERTY,
        property = "type",
        visible = true,
        defaultImpl = DefaultTags.class
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ReqTags.class, name = "req"),
        @JsonSubTypes.Type(value = MethTags.class, name = "meth"),
        @JsonSubTypes.Type(value = MethTags.class, name = "proc"),
        @JsonSubTypes.Type(value = SqlTags.class, name = "sql"),
        @JsonSubTypes.Type(value = TxTags.class, name = "tx"),
        @JsonSubTypes.Type(value = LogTags.class, name = "log"),
        @JsonSubTypes.Type(value = ErrorTags.class, name = "err"),
        @JsonSubTypes.Type(value = BodyTags.class, name = "reqb"),
        @JsonSubTypes.Type(value = BodyTags.class, name = "resb"),
        @JsonSubTypes.Type(value = HeaderTags.class, name = "reqh"),
        @JsonSubTypes.Type(value = ParamTags.class, name = "rp"),
        @JsonSubTypes.Type(value = HeartbeatTags.class, name = "hb")
})
public abstract class SpanTags {
}
