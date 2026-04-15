package org.xi.lt.server.infrastructure.store.h2.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.ApplicationRepository;
import org.xi.lt.server.domain.model.config.Application;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * H2数据库应用Repository实现
 * 用于开发和测试环境
 * 
 * @author system
 * @date 2026/04/15
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "h2")
public class H2ApplicationDaoImpl implements ApplicationRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 应用对象映射器
     */
    private static final RowMapper<Application> APPLICATION_ROW_MAPPER = new RowMapper<Application>() {
        @Override
        public Application mapRow(ResultSet rs, int rowNum) throws SQLException {
            Application app = new Application();
            app.setId(rs.getLong(APP_COL_ID));
            app.setProjectCode(rs.getString(APP_COL_PROJECT_CODE));
            app.setAppCode(rs.getString(APP_COL_APP_CODE));
            app.setAppName(rs.getString(APP_COL_APP_NAME));
            app.setDescription(rs.getString(APP_COL_DESCRIPTION));
            app.setAppType(rs.getString(APP_COL_APP_TYPE));
            app.setAppSecretKey(rs.getString(APP_COL_SECRET_KEY));
            app.setCreateTime(rs.getTimestamp(APP_COL_CREATE_TIME));
            app.setUpdateTime(rs.getTimestamp(APP_COL_UPDATE_TIME));
            return app;
        }
    };

    @Override
    public int insert(Application app) {
        return jdbcTemplate.update(SQL_INSERT_APPLICATION, 
                app.getProjectCode(), 
                app.getAppCode(), 
                app.getAppName(), 
                app.getDescription(),
                app.getAppType(),
                app.getAppSecretKey());
    }

    @Override
    public Application findByAppCode(String appCode) {
        List<Application> list = jdbcTemplate.query(SQL_SELECT_APPLICATION_BY_CODE, APPLICATION_ROW_MAPPER, appCode);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<Application> findByProjectCode(String projectCode) {
        return jdbcTemplate.query(SQL_SELECT_APPLICATION_BY_PROJECT, APPLICATION_ROW_MAPPER, projectCode);
    }

    @Override
    public List<Application> findAll() {
        return jdbcTemplate.query(SQL_SELECT_ALL_APPLICATIONS, APPLICATION_ROW_MAPPER);
    }
}
