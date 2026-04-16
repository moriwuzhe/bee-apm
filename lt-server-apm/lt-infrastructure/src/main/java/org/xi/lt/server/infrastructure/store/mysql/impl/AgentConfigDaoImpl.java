package org.xi.lt.server.infrastructure.store.mysql.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.AgentConfigRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * MySQL Agent配置Repository实现
 * 用于生产环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "mysql", matchIfMissing = true)
public class AgentConfigDaoImpl implements AgentConfigRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final RowMapper<Map<String, Object>> AGENT_CONFIG_ROW_MAPPER = new RowMapper<Map<String, Object>>() {
        @Override
        public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
            HashMap<String, Object> mapRow = new HashMap<>();
            mapRow.put("config", rs.getString(AGENT_CFG_COL_CONFIG));
            mapRow.put("configVersion", rs.getString(AGENT_CFG_COL_CONFIG_VERSION));
            return mapRow;
        }
    };

    @Override
    public int insert(String appCode, String config, String configVersion) {
        return jdbcTemplate.update(SQL_INSERT_AGENT_CONFIG, appCode, config, configVersion);
    }

    @Override
    public int update(String appCode, String config, String configVersion) {
        return jdbcTemplate.update(SQL_UPDATE_AGENT_CONFIG, config, configVersion, appCode);
    }

    @Override
    public String findConfigByAppCode(String appCode) {
        List<Map<String, Object>> list = jdbcTemplate.query(
            SQL_SELECT_AGENT_CONFIG_BY_APP, 
            AGENT_CONFIG_ROW_MAPPER, 
            appCode
        );
        return list.isEmpty() ? null : (String) list.get(0).get("config");
    }

    @Override
    public String findConfigVersionByAppCode(String appCode) {
        List<Map<String, Object>> list = jdbcTemplate.query(
            SQL_SELECT_AGENT_CONFIG_BY_APP, 
            AGENT_CONFIG_ROW_MAPPER, 
            appCode
        );
        return list.isEmpty() ? null : (String) list.get(0).get("configVersion");
    }
}
