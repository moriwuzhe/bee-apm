package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class TrendDataDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String time;
    private Double cpu;
    private Double mem;
    private Double net;
    private Integer err;

    public TrendDataDTO() {}

    public TrendDataDTO(String time, Double cpu, Double mem, Double net, Integer err) {
        this.time = time;
        this.cpu = cpu;
        this.mem = mem;
        this.net = net;
        this.err = err;
    }
}
