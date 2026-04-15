package org.xi.lt.server.domain.model.common;

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
