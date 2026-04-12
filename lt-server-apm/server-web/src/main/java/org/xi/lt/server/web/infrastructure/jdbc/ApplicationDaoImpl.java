package org.xi.lt.server.web.infrastructure.jdbc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.web.domain.repository.ApplicationDao;
import org.xi.lt.server.web.domain.model.Application;

import java.util.List;

@Repository
public class ApplicationDaoImpl implements ApplicationDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = "INSERT INTO bistoury_application (project_code, app_code, app_name, description) VALUES (?, ?, ?, ?)";
    private static final String SELECT_BY_CODE = "SELECT * FROM bistoury_application WHERE app_code = ?";
    private static final String SELECT_BY_PROJECT = "SELECT * FROM bistoury_application WHERE project_code = ? ORDER BY id DESC";
    private static final String SELECT_ALL = "SELECT * FROM bistoury_application ORDER BY id DESC";

    private final RowMapper<Application> rowMapper = (rs, rowNum) -> {
        Application a = new Application();
        a.setId(rs.getLong("id"));
        a.setProjectCode(rs.getString("project_code"));
        a.setAppCode(rs.getString("app_code"));
        a.setAppName(rs.getString("app_name"));
        a.setDescription(rs.getString("description"));
        a.setCreateTime(rs.getTimestamp("create_time"));
        a.setUpdateTime(rs.getTimestamp("update_time"));
        return a;
    };

    @Override
    public int insert(Application app) {
        return jdbcTemplate.update(INSERT_SQL, 
                app.getProjectCode(), 
                app.getAppCode(), 
                app.getAppName(), 
                app.getDescription());
    }

    @Override
    public Application findByAppCode(String appCode) {
        List<Application> list = jdbcTemplate.query(SELECT_BY_CODE, rowMapper, appCode);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<Application> findByProjectCode(String projectCode) {
        return jdbcTemplate.query(SELECT_BY_PROJECT, rowMapper, projectCode);
    }

    @Override
    public List<Application> findAll() {
        return jdbcTemplate.query(SELECT_ALL, rowMapper);
    }
}
