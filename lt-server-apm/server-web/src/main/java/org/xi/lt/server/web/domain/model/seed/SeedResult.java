package org.xi.lt.server.web.domain.model.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SeedResult {
    private long tookMs;
    private boolean hasFailures;
    private int hours;
    private int apps;
    private int instPerApp;
    private int reqPerApp;

    public long getTookMs() {
        return tookMs;
    }

    public void setTookMs(long tookMs) {
        this.tookMs = tookMs;
    }

    public boolean isHasFailures() {
        return hasFailures;
    }

    public void setHasFailures(boolean hasFailures) {
        this.hasFailures = hasFailures;
    }

    public int getHours() {
        return hours;
    }

    public void setHours(int hours) {
        this.hours = hours;
    }

    public int getApps() {
        return apps;
    }

    public void setApps(int apps) {
        this.apps = apps;
    }

    public int getInstPerApp() {
        return instPerApp;
    }

    public void setInstPerApp(int instPerApp) {
        this.instPerApp = instPerApp;
    }

    public int getReqPerApp() {
        return reqPerApp;
    }

    public void setReqPerApp(int reqPerApp) {
        this.reqPerApp = reqPerApp;
    }
}
