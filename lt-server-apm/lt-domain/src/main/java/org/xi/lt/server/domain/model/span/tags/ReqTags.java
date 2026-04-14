package org.xi.lt.server.domain.model.span.tags;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ReqTags extends DefaultTags {
    private String url;
    private String method;
    private String remote;
    private String srcApp;
    private String srcInst;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getRemote() {
        return remote;
    }

    public void setRemote(String remote) {
        this.remote = remote;
    }

    public String getSrcApp() {
        return srcApp;
    }

    public void setSrcApp(String srcApp) {
        this.srcApp = srcApp;
    }

    public String getSrcInst() {
        return srcInst;
    }

    public void setSrcInst(String srcInst) {
        this.srcInst = srcInst;
    }
}
