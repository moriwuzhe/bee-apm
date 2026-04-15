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
    
    // ==================== Agent实例表 ====================
    public static final String TABLE_AGENT_INSTANCE = "bistoury_agent_instance";
    public static final String AGENT_INST_COL_ID = "id";
    public static final String AGENT_INST_COL_PROJECT_CODE = "project_code";
    public static final String AGENT_INST_COL_APP_CODE = "app_code";
    public static final String AGENT_INST_COL_INST_ID = "inst_id";
    public static final String AGENT_INST_COL_IP = "ip";
    public static final String AGENT_INST_COL_VERSION = "version";
    public static final String AGENT_INST_COL_CONFIG_VERSION = "config_version";
    public static final String AGENT_INST_COL_LAST_HEARTBEAT_TIME = "last_heartbeat_time";
    public static final String AGENT_INST_COL_ONLINE = "online";
    public static final String AGENT_INST_COL_CREATE_TIME = "create_time";
    public static final String AGENT_INST_COL_UPDATE_TIME = "update_time";
    
    // ==================== Agent配置表 ====================
    public static final String TABLE_AGENT_CONFIG = "bistoury_agent_config";
    public static final String AGENT_CFG_COL_ID = "id";
    public static final String AGENT_CFG_COL_APP_CODE = "app_code";
    public static final String AGENT_CFG_COL_CONFIG = "config";
    public static final String AGENT_CFG_COL_CONFIG_VERSION = "config_version";
    public static final String AGENT_CFG_COL_CREATE_TIME = "create_time";
    public static final String AGENT_CFG_COL_UPDATE_TIME = "update_time";
    
    // ==================== Agent SQL模板 ====================
    /**
     * 插入Agent实例的SQL
     */
    public static final String SQL_INSERT_AGENT_INSTANCE = 
        "INSERT INTO " + TABLE_AGENT_INSTANCE + 
        " (" + AGENT_INST_COL_PROJECT_CODE + ", " + AGENT_INST_COL_APP_CODE + ", " + 
        AGENT_INST_COL_INST_ID + ", " + AGENT_INST_COL_IP + ", " + 
        AGENT_INST_COL_VERSION + ", " + AGENT_INST_COL_CONFIG_VERSION + ", " +
        AGENT_INST_COL_LAST_HEARTBEAT_TIME + ", " + AGENT_INST_COL_ONLINE + ") " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    /**
     * 更新Agent实例的SQL
     */
    public static final String SQL_UPDATE_AGENT_INSTANCE = 
        "UPDATE " + TABLE_AGENT_INSTANCE + 
        " SET " + AGENT_INST_COL_PROJECT_CODE + " = ?, " + AGENT_INST_COL_IP + " = ?, " + 
        AGENT_INST_COL_VERSION + " = ?, " + AGENT_INST_COL_CONFIG_VERSION + " = ?, " +
        AGENT_INST_COL_LAST_HEARTBEAT_TIME + " = ?, " + AGENT_INST_COL_ONLINE + " = ?, " +
        AGENT_INST_COL_UPDATE_TIME + " = CURRENT_TIMESTAMP " +
        " WHERE " + AGENT_INST_COL_APP_CODE + " = ? AND " + AGENT_INST_COL_INST_ID + " = ?";
    
    /**
     * 根据应用代码和实例ID查询Agent实例
     */
    public static final String SQL_SELECT_AGENT_INSTANCE_BY_APP_AND_INST = 
        "SELECT * FROM " + TABLE_AGENT_INSTANCE + 
        " WHERE " + AGENT_INST_COL_APP_CODE + " = ? AND " + AGENT_INST_COL_INST_ID + " = ?";
    
    /**
     * 查询所有Agent实例
     */
    public static final String SQL_SELECT_ALL_AGENT_INSTANCES = 
        "SELECT * FROM " + TABLE_AGENT_INSTANCE + 
        " ORDER BY " + AGENT_INST_COL_ID + " DESC";
    
    /**
     * 插入Agent配置的SQL
     */
    public static final String SQL_INSERT_AGENT_CONFIG = 
        "INSERT INTO " + TABLE_AGENT_CONFIG + 
        " (" + AGENT_CFG_COL_APP_CODE + ", " + AGENT_CFG_COL_CONFIG + ", " + 
        AGENT_CFG_COL_CONFIG_VERSION + ") " +
        "VALUES (?, ?, ?)";
    
    /**
     * 更新Agent配置的SQL
     */
    public static final String SQL_UPDATE_AGENT_CONFIG = 
        "UPDATE " + TABLE_AGENT_CONFIG + 
        " SET " + AGENT_CFG_COL_CONFIG + " = ?, " + AGENT_CFG_COL_CONFIG_VERSION + " = ?, " +
        AGENT_CFG_COL_UPDATE_TIME + " = CURRENT_TIMESTAMP " +
        " WHERE " + AGENT_CFG_COL_APP_CODE + " = ?";
    
    /**
     * 根据应用代码查询Agent配置
     */
    public static final String SQL_SELECT_AGENT_CONFIG_BY_APP = 
        "SELECT * FROM " + TABLE_AGENT_CONFIG + 
        " WHERE " + AGENT_CFG_COL_APP_CODE + " = ?";
    
    // ==================== 插件信息表 ====================
    public static final String TABLE_PLUGIN_INFO = "bistoury_plugin_info";
    public static final String PLUGIN_COL_ID = "id";
    public static final String PLUGIN_COL_PLUGIN_CODE = "plugin_code";
    public static final String PLUGIN_COL_PLUGIN_NAME = "plugin_name";
    public static final String PLUGIN_COL_PLUGIN_TYPE = "plugin_type";
    public static final String PLUGIN_COL_VERSION = "version";
    public static final String PLUGIN_COL_DESCRIPTION = "description";
    public static final String PLUGIN_COL_FILE_NAME = "file_name";
    public static final String PLUGIN_COL_FILE_SIZE = "file_size";
    public static final String PLUGIN_COL_FILE_MD5 = "file_md5";
    public static final String PLUGIN_COL_DOWNLOAD_URL = "download_url";
    public static final String PLUGIN_COL_ENABLED = "enabled";
    public static final String PLUGIN_COL_CREATE_TIME = "create_time";
    public static final String PLUGIN_COL_UPDATE_TIME = "update_time";
    
    // ==================== 插件 SQL模板 ====================
    /**
     * 插入插件信息的SQL
     */
    public static final String SQL_INSERT_PLUGIN_INFO = 
        "INSERT INTO " + TABLE_PLUGIN_INFO + 
        " (" + PLUGIN_COL_PLUGIN_CODE + ", " + PLUGIN_COL_PLUGIN_NAME + ", " + 
        PLUGIN_COL_PLUGIN_TYPE + ", " + PLUGIN_COL_VERSION + ", " +
        PLUGIN_COL_DESCRIPTION + ", " + PLUGIN_COL_FILE_NAME + ", " +
        PLUGIN_COL_FILE_SIZE + ", " + PLUGIN_COL_FILE_MD5 + ", " +
        PLUGIN_COL_DOWNLOAD_URL + ", " + PLUGIN_COL_ENABLED + ") " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    /**
     * 更新插件信息的SQL
     */
    public static final String SQL_UPDATE_PLUGIN_INFO = 
        "UPDATE " + TABLE_PLUGIN_INFO + 
        " SET " + PLUGIN_COL_PLUGIN_NAME + " = ?, " + PLUGIN_COL_PLUGIN_TYPE + " = ?, " +
        PLUGIN_COL_VERSION + " = ?, " + PLUGIN_COL_DESCRIPTION + " = ?, " +
        PLUGIN_COL_FILE_NAME + " = ?, " + PLUGIN_COL_FILE_SIZE + " = ?, " +
        PLUGIN_COL_FILE_MD5 + " = ?, " + PLUGIN_COL_DOWNLOAD_URL + " = ?, " +
        PLUGIN_COL_ENABLED + " = ?, " + PLUGIN_COL_UPDATE_TIME + " = CURRENT_TIMESTAMP " +
        " WHERE " + PLUGIN_COL_PLUGIN_CODE + " = ?";
    
    /**
     * 根据插件编码查询
     */
    public static final String SQL_SELECT_PLUGIN_BY_CODE = 
        "SELECT * FROM " + TABLE_PLUGIN_INFO + 
        " WHERE " + PLUGIN_COL_PLUGIN_CODE + " = ?";
    
    /**
     * 查询所有启用的插件
     */
    public static final String SQL_SELECT_ALL_ENABLED_PLUGINS = 
        "SELECT * FROM " + TABLE_PLUGIN_INFO + 
        " WHERE " + PLUGIN_COL_ENABLED + " = TRUE " +
        " ORDER BY " + PLUGIN_COL_ID + " DESC";
    
    /**
     * 查询所有插件
     */
    public static final String SQL_SELECT_ALL_PLUGINS = 
        "SELECT * FROM " + TABLE_PLUGIN_INFO + 
        " ORDER BY " + PLUGIN_COL_ID + " DESC";
    
    // 私有构造函数，防止实例化
    private DatabaseConstants() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
}
