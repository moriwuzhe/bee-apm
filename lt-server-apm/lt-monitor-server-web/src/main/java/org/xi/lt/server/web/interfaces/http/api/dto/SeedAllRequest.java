package org.xi.lt.server.web.interfaces.http.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SeedAllRequest {
    private Integer hours;
    private Integer apps;
    private Integer instPerApp;
    private Integer reqPerApp;

    public Integer getHours() {
        return hours;
    }

    public void setHours(Integer hours) {
        this.hours = hours;
    }

    public Integer getApps() {
        return apps;
    }

    public void setApps(Integer apps) {
        this.apps = apps;
    }

    public Integer getInstPerApp() {
        return instPerApp;
    }

    public void setInstPerApp(Integer instPerApp) {
        this.instPerApp = instPerApp;
    }

    public Integer getReqPerApp() {
        return reqPerApp;
    }

    public void setReqPerApp(Integer reqPerApp) {
        this.reqPerApp = reqPerApp;
    }
}
