package org.xi.lt.server.web.diagnostic.ui.dao;

import org.xi.lt.server.web.diagnostic.ui.model.Project;
import java.util.List;

public interface ProjectDao {
    int insert(Project project);
    Project findByProjectCode(String projectCode);
    List<Project> findAll();
}
