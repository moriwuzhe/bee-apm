package org.xi.lt.server.infrastructure.store.config;

/**
 * 数据库表名和字段名常量
 * 统一管理所有SQL相关的常量，避免硬编码
 * 
 * @author system
 * @date 2026/04/15
 */
public final class DatabaseConstants {
    
    // ==================== 项目表 ====================
    public static final String TABLE_PROJECT = "bistoury_project";
    public static final String PROJECT_COL_ID = "id";
    public static final String PROJECT_COL_CODE = "project_code";
    public static final String PROJECT_COL_NAME = "project_name";
    public static final String PROJECT_COL_SECRET_KEY = "secret_key";
    public static final String PROJECT_COL_DESCRIPTION = "description";
    public static final String PROJECT_COL_TEAM_ID = "team_id";
    public static final String PROJECT_COL_TEAM_NAME = "team_name";
    public static final String PROJECT_COL_CREATE_TIME = "create_time";
    public static final String PROJECT_COL_UPDATE_TIME = "update_time";
    
    // ==================== 应用表 ====================
    public static final String TABLE_APPLICATION = "bistoury_application";
    public static final String APP_COL_ID = "id";
    public static final String APP_COL_PROJECT_CODE = "project_code";
    public static final String APP_COL_APP_CODE = "app_code";
    public static final String APP_COL_APP_NAME = "app_name";
    public static final String APP_COL_DESCRIPTION = "description";
    public static final String APP_COL_APP_TYPE = "app_type";
    public static final String APP_COL_SECRET_KEY = "app_secret_key";
    public static final String APP_COL_CREATE_TIME = "create_time";
    public static final String APP_COL_UPDATE_TIME = "update_time";
    
    // ==================== SQL模板 ====================
    /**
     * 插入项目的SQL
     */
    public static final String SQL_INSERT_PROJECT = 
        "INSERT INTO " + TABLE_PROJECT + 
        " (" + PROJECT_COL_CODE + ", " + PROJECT_COL_NAME + ", " + 
        PROJECT_COL_SECRET_KEY + ", " + PROJECT_COL_DESCRIPTION + ", " +
        PROJECT_COL_TEAM_ID + ", " + PROJECT_COL_TEAM_NAME + ") " +
        "VALUES (?, ?, ?, ?, ?, ?)";
    
    /**
     * 根据项目代码查询
     */
    public static final String SQL_SELECT_PROJECT_BY_CODE = 
        "SELECT * FROM " + TABLE_PROJECT + 
        " WHERE " + PROJECT_COL_CODE + " = ?";
    
    /**
     * 查询所有项目（按ID倒序）
     */
    public static final String SQL_SELECT_ALL_PROJECTS = 
        "SELECT * FROM " + TABLE_PROJECT + 
        " ORDER BY " + PROJECT_COL_ID + " DESC";
    
    /**
     * 插入应用的SQL
     */
    public static final String SQL_INSERT_APPLICATION = 
        "INSERT INTO " + TABLE_APPLICATION + 
        " (" + APP_COL_PROJECT_CODE + ", " + APP_COL_APP_CODE + ", " + 
        APP_COL_APP_NAME + ", " + APP_COL_DESCRIPTION + ", " +
        APP_COL_APP_TYPE + ", " + APP_COL_SECRET_KEY + ") " +
        "VALUES (?, ?, ?, ?, ?, ?)";
    
    /**
     * 根据应用代码查询
     */
    public static final String SQL_SELECT_APPLICATION_BY_CODE = 
        "SELECT * FROM " + TABLE_APPLICATION + 
        " WHERE " + APP_COL_APP_CODE + " = ?";
    
    /**
     * 根据项目代码查询应用
     */
    public static final String SQL_SELECT_APPLICATION_BY_PROJECT = 
        "SELECT * FROM " + TABLE_APPLICATION + 
        " WHERE " + APP_COL_PROJECT_CODE + " = ?" +
        " ORDER BY " + APP_COL_ID + " DESC";
    
    /**
     * 查询所有应用（按ID倒序）
     */
    public static final String SQL_SELECT_ALL_APPLICATIONS = 
        "SELECT * FROM " + TABLE_APPLICATION + 
        " ORDER BY " + APP_COL_ID + " DESC";
    
    // 私有构造函数，防止实例化
    private DatabaseConstants() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
}
