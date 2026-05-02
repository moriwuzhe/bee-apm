package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class AlertTrendDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private Integer critical;
    private Integer warning;
    private Integer info;

    public AlertTrendDTO() {}

    public AlertTrendDTO(String name, Integer critical, Integer warning, Integer info) {
        this.name = name;
        this.critical = critical;
        this.warning = warning;
        this.info = info;
    }
}
