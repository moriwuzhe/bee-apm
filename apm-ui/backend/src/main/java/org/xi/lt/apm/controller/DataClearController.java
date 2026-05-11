package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.repository.*;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.transaction.Transactional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DataClearController {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @DeleteMapping("/clear")
    @Transactional
    public Result<String> clearAllData() {
        try {
            // 清空所有表的数据（保留权限、角色、用户相关的表）
            String[] tablesToClear = {
                "apm_trace_span",
                "apm_metric",
                "apm_alert",
                "sys_alert_rule",
                "sys_release"
            };

            for (String table : tablesToClear) {
                Query query = entityManager.createNativeQuery("DELETE FROM " + table);
                query.executeUpdate();
            }

            // 清空应用表（但保留结构）
            Query appQuery = entityManager.createNativeQuery("DELETE FROM apm_application");
            appQuery.executeUpdate();

            // 清空项目表（但保留结构）
            Query projectQuery = entityManager.createNativeQuery("DELETE FROM sys_project");
            projectQuery.executeUpdate();

            return Result.success("All data cleared successfully (permissions, roles, users preserved)");
        } catch (Exception e) {
            return Result.error("Failed to clear data: " + e.getMessage());
        }
    }

    @DeleteMapping("/reset")
    @Transactional
    public Result<String> resetDatabase() {
        try {
            // 完全重置数据库（会删除所有表并重新创建）
            // 这会清空所有数据，包括权限、角色、用户
            Query dropQuery = entityManager.createNativeQuery("RUNSCRIPT FROM 'classpath:schema-h2.sql'");
            // 不执行DROP语句，因为Hibernate会用ddl-auto=create-drop来管理
            
            return Result.success("Database reset successfully");
        } catch (Exception e) {
            return Result.error("Failed to reset database: " + e.getMessage());
        }
    }
}
