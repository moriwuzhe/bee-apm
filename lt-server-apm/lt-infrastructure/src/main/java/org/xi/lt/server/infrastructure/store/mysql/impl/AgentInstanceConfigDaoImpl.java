package org.xi.lt.server.infrastructure.store.mysql.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.AgentInstanceConfigRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * MySQL Agent实例配置Repository实现
 * 用于生产环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "mysql", matchIfMissing = true)
public class AgentInstanceConfigDaoImpl implements AgentInstanceConfigRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final RowMapper<Map<String, Object>> AGENT_INSTANCE_CONFIG_ROW_MAPPER = new RowMapper<Map<String, Object>>() {
        @Override
        public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
            return Map.of(
                "config", rs.getString(AGENT_INST_CFG_COL_CONFIG),
                "configVersion", rs.getString(AGENT_INST_CFG_COL_CONFIG_VERSION)
            );
        }
    };

    @Override
    public int insert(String appCode, String instId, String config, String configVersion) {
        return jdbcTemplate.update(SQL_INSERT_AGENT_INSTANCE_CONFIG, appCode, instId, config, configVersion);
    }

    @Override
    public int update(String appCode, String instId, String config, String configVersion) {
        return jdbcTemplate.update(SQL_UPDATE_AGENT_INSTANCE_CONFIG, config, configVersion, appCode, instId);
    }

    @Override
    public String findConfigByAppCodeAndInstId(String appCode, String instId) {
        List<Map<String, Object>> list = jdbcTemplate.query(
            SQL_SELECT_AGENT_INSTANCE_CONFIG_BY_APP_AND_INST, 
            AGENT_INSTANCE_CONFIG_ROW_MAPPER, 
            appCode, 
            instId
        );
        return list.isEmpty() ? null : (String) list.get(0).get("config");
    }

    @Override
    public String findConfigVersionByAppCodeAndInstId(String appCode, String instId) {
        List<Map<String, Object>> list = jdbcTemplate.query(
            SQL_SELECT_AGENT_INSTANCE_CONFIG_BY_APP_AND_INST, 
            AGENT_INSTANCE_CONFIG_ROW_MAPPER, 
            appCode, 
            instId
        );
        return list.isEmpty() ? null : (String) list.get(0).get("configVersion");
    }
}
