package org.xi.lt.server.web.domain.repository;

import org.xi.lt.server.web.domain.model.Application;
import java.util.List;

public interface ApplicationDao {
    int insert(Application app);
    Application findByAppCode(String appCode);
    List<Application> findByProjectCode(String projectCode);
    List<Application> findAll();
}
