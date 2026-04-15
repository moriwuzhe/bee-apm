package org.xi.lt.server.infrastructure.store.h2.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.repository.AgentConfigRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * H2数据库Agent配置Repository实现
 * 用于开发和测试环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "h2")
public class H2AgentConfigDaoImpl implements AgentConfigRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final RowMapper<Map<String, Object>> AGENT_CONFIG_ROW_MAPPER = new RowMapper<Map<String, Object>>() {
        @Override
        public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
            return Map.of(
                "config", rs.getString(AGENT_CFG_COL_CONFIG),
                "configVersion", rs.getString(AGENT_CFG_COL_CONFIG_VERSION)
            );
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
