package org.xi.lt.server.infrastructure.store.mysql.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.ProjectRepository;
import org.xi.lt.server.domain.model.config.Project;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * MySQL项目Repository实现
 * 用于生产环境
 * 
 * @author system
 * @date 2026/04/15
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "mysql", matchIfMissing = true)
public class ProjectDaoImpl implements ProjectRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 项目对象映射器
     */
    private static final RowMapper<Project> PROJECT_ROW_MAPPER = new RowMapper<Project>() {
        @Override
        public Project mapRow(ResultSet rs, int rowNum) throws SQLException {
            Project project = new Project();
            project.setId(rs.getLong(PROJECT_COL_ID));
            project.setProjectCode(rs.getString(PROJECT_COL_CODE));
            project.setProjectName(rs.getString(PROJECT_COL_NAME));
            project.setSecretKey(rs.getString(PROJECT_COL_SECRET_KEY));
            project.setDescription(rs.getString(PROJECT_COL_DESCRIPTION));
            project.setTeamId(rs.getString(PROJECT_COL_TEAM_ID));
            project.setTeamName(rs.getString(PROJECT_COL_TEAM_NAME));
            project.setCreateTime(rs.getTimestamp(PROJECT_COL_CREATE_TIME));
            project.setUpdateTime(rs.getTimestamp(PROJECT_COL_UPDATE_TIME));
            return project;
        }
    };

    @Override
    public int insert(Project project) {
        return jdbcTemplate.update(SQL_INSERT_PROJECT, 
                project.getProjectCode(), 
                project.getProjectName(), 
                project.getSecretKey(), 
                project.getDescription(),
                project.getTeamId(),
                project.getTeamName());
    }

    @Override
    public Project findByProjectCode(String projectCode) {
        List<Project> list = jdbcTemplate.query(SQL_SELECT_PROJECT_BY_CODE, PROJECT_ROW_MAPPER, projectCode);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<Project> findAll() {
        return jdbcTemplate.query(SQL_SELECT_ALL_PROJECTS, PROJECT_ROW_MAPPER);
    }
}
