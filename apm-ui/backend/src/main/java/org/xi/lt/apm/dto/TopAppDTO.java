package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class TopAppDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private String status;
    private Double cpu;
    private Double mem;
    private Integer inst;

    public TopAppDTO() {}

    public TopAppDTO(String name, String status, Double cpu, Double mem, Integer inst) {
        this.name = name;
        this.status = status;
        this.cpu = cpu;
        this.mem = mem;
        this.inst = inst;
    }
}
