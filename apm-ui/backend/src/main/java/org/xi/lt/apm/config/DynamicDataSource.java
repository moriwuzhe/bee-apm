package org.xi.lt.apm.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class DynamicDataSource extends AbstractRoutingDataSource {

    private static final ThreadLocal<String> CONTEXT_HOLDER = new ThreadLocal<>();

    public static void setDataSource(String dataSourceType) {
        CONTEXT_HOLDER.set(dataSourceType);
    }

    public static String getDataSource() {
        return CONTEXT_HOLDER.get();
    }

    public static void clearDataSource() {
        CONTEXT_HOLDER.remove();
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return getDataSource();
    }
}
