package org.xi.lt.server.web.shared.model;

import java.util.Collections;
import java.util.List;

public class PageResult<T> {
    private List<T> rows;
    private int pageNum;
    private int pageTotal;

    public PageResult() {
    }

    public PageResult(List<T> rows, int pageNum, int pageTotal) {
        this.rows = rows;
        this.pageNum = pageNum;
        this.pageTotal = pageTotal;
    }

    public static <T> PageResult<T> empty(int pageNum) {
        return new PageResult<>(Collections.emptyList(), pageNum, 0);
    }

    public List<T> getRows() {
        return rows;
    }

    public void setRows(List<T> rows) {
        this.rows = rows;
    }

    public int getPageNum() {
        return pageNum;
    }

    public void setPageNum(int pageNum) {
        this.pageNum = pageNum;
    }

    public int getPageTotal() {
        return pageTotal;
    }

    public void setPageTotal(int pageTotal) {
        this.pageTotal = pageTotal;
    }
}
