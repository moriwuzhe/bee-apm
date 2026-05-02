package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class RecentAlertDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String app;
    private String env;
    private String type;
    private String level;
    private String time;

    public RecentAlertDTO() {}

    public RecentAlertDTO(String app, String env, String type, String level, String time) {
        this.app = app;
        this.env = env;
        this.type = type;
        this.level = level;
        this.time = time;
    }
}
