package org.xi.lt.server.domain.model.dashboard;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DashboardStatResult {
    private long req;
    private long log;
    private long error;
    private long inst;

    public long getReq() {
        return req;
    }

    public void setReq(long req) {
        this.req = req;
    }

    public long getLog() {
        return log;
    }

    public void setLog(long log) {
        this.log = log;
    }

    public long getError() {
        return error;
    }

    public void setError(long error) {
        this.error = error;
    }

    public long getInst() {
        return inst;
    }

    public void setInst(long inst) {
        this.inst = inst;
    }
}
