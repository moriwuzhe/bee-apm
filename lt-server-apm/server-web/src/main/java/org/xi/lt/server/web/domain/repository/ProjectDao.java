package org.xi.lt.server.web.domain.repository;

import org.xi.lt.server.web.domain.model.Project;
import java.util.List;

public interface ProjectDao {
    int insert(Project project);
    Project findByProjectCode(String projectCode);
    List<Project> findAll();
}
