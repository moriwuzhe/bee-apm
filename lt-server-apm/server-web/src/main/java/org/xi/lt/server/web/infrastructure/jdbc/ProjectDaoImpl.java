package org.xi.lt.server.web.infrastructure.jdbc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.web.domain.repository.ProjectDao;
import org.xi.lt.server.web.domain.model.Project;

import java.util.List;

@Repository
public class ProjectDaoImpl implements ProjectDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = "INSERT INTO bistoury_project (project_code, project_name, secret_key, description) VALUES (?, ?, ?, ?)";
    private static final String SELECT_BY_CODE = "SELECT * FROM bistoury_project WHERE project_code = ?";
    private static final String SELECT_ALL = "SELECT * FROM bistoury_project ORDER BY id DESC";

    private final RowMapper<Project> rowMapper = (rs, rowNum) -> {
        Project p = new Project();
        p.setId(rs.getLong("id"));
        p.setProjectCode(rs.getString("project_code"));
        p.setProjectName(rs.getString("project_name"));
        p.setSecretKey(rs.getString("secret_key"));
        p.setDescription(rs.getString("description"));
        p.setCreateTime(rs.getTimestamp("create_time"));
        p.setUpdateTime(rs.getTimestamp("update_time"));
        return p;
    };

    @Override
    public int insert(Project project) {
        return jdbcTemplate.update(INSERT_SQL, 
                project.getProjectCode(), 
                project.getProjectName(), 
                project.getSecretKey(), 
                project.getDescription());
    }

    @Override
    public Project findByProjectCode(String projectCode) {
        List<Project> list = jdbcTemplate.query(SELECT_BY_CODE, rowMapper, projectCode);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<Project> findAll() {
        return jdbcTemplate.query(SELECT_ALL, rowMapper);
    }
}
