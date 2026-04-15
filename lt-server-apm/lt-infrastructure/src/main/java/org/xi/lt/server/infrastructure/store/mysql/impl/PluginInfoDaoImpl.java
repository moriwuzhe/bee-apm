package org.xi.lt.server.infrastructure.store.mysql.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.model.plugin.PluginInfo;
import org.xi.lt.server.domain.repository.PluginInfoRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * MySQL插件信息Repository实现
 * 用于生产环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "mysql", matchIfMissing = true)
public class PluginInfoDaoImpl implements PluginInfoRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 插件信息对象映射器
     */
    private static final RowMapper<PluginInfo> PLUGIN_INFO_ROW_MAPPER = new RowMapper<PluginInfo>() {
        @Override
        public PluginInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
            PluginInfo pluginInfo = new PluginInfo();
            pluginInfo.setId(rs.getLong(PLUGIN_COL_ID));
            pluginInfo.setPluginCode(rs.getString(PLUGIN_COL_PLUGIN_CODE));
            pluginInfo.setPluginName(rs.getString(PLUGIN_COL_PLUGIN_NAME));
            pluginInfo.setPluginType(rs.getString(PLUGIN_COL_PLUGIN_TYPE));
            pluginInfo.setVersion(rs.getString(PLUGIN_COL_VERSION));
            pluginInfo.setDescription(rs.getString(PLUGIN_COL_DESCRIPTION));
            pluginInfo.setFileName(rs.getString(PLUGIN_COL_FILE_NAME));
            pluginInfo.setFileSize(rs.getLong(PLUGIN_COL_FILE_SIZE));
            pluginInfo.setFileMd5(rs.getString(PLUGIN_COL_FILE_MD5));
            pluginInfo.setDownloadUrl(rs.getString(PLUGIN_COL_DOWNLOAD_URL));
            pluginInfo.setEnabled(rs.getBoolean(PLUGIN_COL_ENABLED));
            pluginInfo.setCreateTime(rs.getTimestamp(PLUGIN_COL_CREATE_TIME));
            pluginInfo.setUpdateTime(rs.getTimestamp(PLUGIN_COL_UPDATE_TIME));
            return pluginInfo;
        }
    };

    @Override
    public int insert(PluginInfo pluginInfo) {
        return jdbcTemplate.update(SQL_INSERT_PLUGIN_INFO, 
                pluginInfo.getPluginCode(), 
                pluginInfo.getPluginName(), 
                pluginInfo.getPluginType(), 
                pluginInfo.getVersion(),
                pluginInfo.getDescription(),
                pluginInfo.getFileName(),
                pluginInfo.getFileSize(),
                pluginInfo.getFileMd5(),
                pluginInfo.getDownloadUrl(),
                pluginInfo.getEnabled());
    }

    @Override
    public int update(PluginInfo pluginInfo) {
        return jdbcTemplate.update(SQL_UPDATE_PLUGIN_INFO, 
                pluginInfo.getPluginName(), 
                pluginInfo.getPluginType(), 
                pluginInfo.getVersion(),
                pluginInfo.getDescription(),
                pluginInfo.getFileName(),
                pluginInfo.getFileSize(),
                pluginInfo.getFileMd5(),
                pluginInfo.getDownloadUrl(),
                pluginInfo.getEnabled(),
                pluginInfo.getPluginCode());
    }

    @Override
    public PluginInfo findByPluginCode(String pluginCode) {
        List<PluginInfo> list = jdbcTemplate.query(SQL_SELECT_PLUGIN_BY_CODE, PLUGIN_INFO_ROW_MAPPER, pluginCode);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<PluginInfo> findAllEnabled() {
        return jdbcTemplate.query(SQL_SELECT_ALL_ENABLED_PLUGINS, PLUGIN_INFO_ROW_MAPPER);
    }

    @Override
    public List<PluginInfo> findAll() {
        return jdbcTemplate.query(SQL_SELECT_ALL_PLUGINS, PLUGIN_INFO_ROW_MAPPER);
    }
}
