package org.xi.lt.server.infrastructure.store.h2.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;
import org.xi.lt.server.domain.repository.AgentInstanceRepository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

import static org.xi.lt.server.infrastructure.store.config.DatabaseConstants.*;

/**
 * H2数据库Agent实例Repository实现
 * 用于开发和测试环境
 * 
 * @author system
 * @date 2026/04/16
 */
@Repository
@ConditionalOnProperty(name = "lt.store.type", havingValue = "h2")
public class H2AgentInstanceDaoImpl implements AgentInstanceRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Agent实例对象映射器
     */
    private static final RowMapper<AgentInstanceInfo> AGENT_INSTANCE_ROW_MAPPER = new RowMapper<AgentInstanceInfo>() {
        @Override
        public AgentInstanceInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
            AgentInstanceInfo agentInstance = new AgentInstanceInfo();
            agentInstance.setProjectCode(rs.getString(AGENT_INST_COL_PROJECT_CODE));
            agentInstance.setApp(rs.getString(AGENT_INST_COL_APP_CODE));
            agentInstance.setInst(rs.getString(AGENT_INST_COL_INST_ID));
            agentInstance.setIp(rs.getString(AGENT_INST_COL_IP));
            agentInstance.setVersion(rs.getString(AGENT_INST_COL_VERSION));
            agentInstance.setConfigVersion(rs.getString(AGENT_INST_COL_CONFIG_VERSION));
            
            Timestamp lastHeartbeat = rs.getTimestamp(AGENT_INST_COL_LAST_HEARTBEAT_TIME);
            agentInstance.setLastHeartbeatTime(lastHeartbeat != null ? lastHeartbeat.getTime() : 0);
            
            agentInstance.setOnline(rs.getBoolean(AGENT_INST_COL_ONLINE));
            return agentInstance;
        }
    };

    @Override
    public int insert(AgentInstanceInfo agentInstance) {
        return jdbcTemplate.update(SQL_INSERT_AGENT_INSTANCE, 
                agentInstance.getProjectCode(),
                agentInstance.getApp(), 
                agentInstance.getInst(), 
                agentInstance.getIp(), 
                agentInstance.getVersion(),
                agentInstance.getConfigVersion(),
                new Timestamp(agentInstance.getLastHeartbeatTime()),
                agentInstance.isOnline());
    }

    @Override
    public int update(AgentInstanceInfo agentInstance) {
        return jdbcTemplate.update(SQL_UPDATE_AGENT_INSTANCE, 
                agentInstance.getProjectCode(),
                agentInstance.getIp(), 
                agentInstance.getVersion(), 
                agentInstance.getConfigVersion(),
                new Timestamp(agentInstance.getLastHeartbeatTime()),
                agentInstance.isOnline(),
                agentInstance.getApp(),
                agentInstance.getInst());
    }

    @Override
    public AgentInstanceInfo findByAppCodeAndInstId(String appCode, String instId) {
        List<AgentInstanceInfo> list = jdbcTemplate.query(
            SQL_SELECT_AGENT_INSTANCE_BY_APP_AND_INST, 
            AGENT_INSTANCE_ROW_MAPPER, 
            appCode, 
            instId
        );
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<AgentInstanceInfo> findAll() {
        return jdbcTemplate.query(SQL_SELECT_ALL_AGENT_INSTANCES, AGENT_INSTANCE_ROW_MAPPER);
    }
}
