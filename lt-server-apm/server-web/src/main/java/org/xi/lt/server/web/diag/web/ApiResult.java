package org.xi.lt.server.web.diag.web;

public class ApiResult<T> {
    private String code;
    private String msg;
    private T result;

    public ApiResult() {
    }

    public ApiResult(String code, String msg, T result) {
        this.code = code;
        this.msg = msg;
        this.result = result;
    }

    public static <T> ApiResult<T> ok(T data) {
        return new ApiResult<>("0", "成功", data);
    }

    public static <T> ApiResult<T> fail(String msg) {
        return new ApiResult<>("1", msg, null);
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getResult() {
        return result;
    }

    public void setResult(T result) {
        this.result = result;
    }
}
