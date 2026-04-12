package org.xi.lt.server.web.domain.model;

import java.util.List;

public class PageSearchResult<T> {
    private final long total;
    private final List<T> rows;

    public PageSearchResult(long total, List<T> rows) {
        this.total = total;
        this.rows = rows;
    }

    public long getTotal() {
        return total;
    }

    public List<T> getRows() {
        return rows;
    }
}
