package org.xi.lt.server.infrastructure.store.h2.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.AgentInstanceConfigRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * H2数据库Agent实例配置Repository实现
 * 用于开发和测试环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "h2")
public class H2AgentInstanceConfigDaoImpl implements AgentInstanceConfigRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final RowMapper<Map<String, Object>> AGENT_INSTANCE_CONFIG_ROW_MAPPER = new RowMapper<Map<String, Object>>() {
        @Override
        public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
            HashMap<String, Object> mapRow = new HashMap<>();
            mapRow.put("config", rs.getString(AGENT_INST_CFG_COL_CONFIG));
            mapRow.put("configVersion", rs.getString(AGENT_INST_CFG_COL_CONFIG_VERSION));
            return mapRow;
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
