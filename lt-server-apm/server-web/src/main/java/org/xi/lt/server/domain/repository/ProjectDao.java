package org.xi.lt.server.domain.repository;

import org.xi.lt.server.domain.model.Project;
import java.util.List;

public interface ProjectDao {
    int insert(Project project);
    Project findByProjectCode(String projectCode);
    List<Project> findAll();
}
