package org.xi.lt.server.web.diagnostic.ui.dao;

import org.xi.lt.server.web.diagnostic.ui.model.Application;
import java.util.List;

public interface ApplicationDao {
    int insert(Application app);
    Application findByAppCode(String appCode);
    List<Application> findByProjectCode(String projectCode);
    List<Application> findAll();
}
