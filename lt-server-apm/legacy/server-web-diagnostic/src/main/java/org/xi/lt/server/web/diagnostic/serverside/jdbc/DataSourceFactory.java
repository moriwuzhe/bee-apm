package org.xi.lt.server.web.diagnostic.serverside.jdbc;

import javax.sql.DataSource;

import org.xi.lt.server.web.diagnostic.serverside.configuration.DynamicConfig;

public interface DataSourceFactory {

	DataSource createDataSource(DynamicConfig dynamicConfig);

}
