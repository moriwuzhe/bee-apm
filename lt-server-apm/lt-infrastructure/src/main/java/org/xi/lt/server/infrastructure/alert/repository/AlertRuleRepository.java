package org.xi.lt.server.infrastructure.alert.repository;

import org.xi.lt.server.domain.model.alert.AlertRule;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 告警规则数据访问层
 */
@Repository
public class AlertRuleRepository {

    private final JdbcTemplate jdbcTemplate;

    public AlertRuleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<AlertRule> ROW_MAPPER = new RowMapper<AlertRule>() {
        @Override
        public AlertRule mapRow(ResultSet rs, int rowNum) throws SQLException {
            AlertRule rule = new AlertRule();
            rule.setId(rs.getLong("id"));
            rule.setRuleName(rs.getString("rule_name"));
            rule.setAppCode(rs.getString("app_code"));
            rule.setMetricName(rs.getString("metric_name"));
            rule.setOperator(rs.getString("operator"));
            rule.setThreshold(rs.getDouble("threshold"));
            rule.setDuration(rs.getInt("duration"));
            rule.setSeverity(rs.getString("severity"));
            rule.setNotificationType(rs.getString("notification_type"));
            rule.setNotificationTarget(rs.getString("notification_target"));
            rule.setEnabled(rs.getBoolean("enabled"));
            
            java.sql.Timestamp createTime = rs.getTimestamp("create_time");
            if (createTime != null) {
                rule.setCreateTime(createTime.toLocalDateTime());
            }
            
            java.sql.Timestamp updateTime = rs.getTimestamp("update_time");
            if (updateTime != null) {
                rule.setUpdateTime(updateTime.toLocalDateTime());
            }
            
            rule.setDescription(rs.getString("description"));
            return rule;
        }
    };

    /**
     * 查询所有启用的告警规则
     */
    public List<AlertRule> findAllEnabled() {
        String sql = "SELECT * FROM alert_rules WHERE enabled = TRUE ORDER BY id";
        return jdbcTemplate.query(sql, ROW_MAPPER);
    }

    /**
     * 根据应用代码查询告警规则（支持通配符*）
     */
    public List<AlertRule> findByAppCode(String appCode) {
        String sql = "SELECT * FROM alert_rules WHERE (app_code = ? OR app_code = '*') AND enabled = TRUE ORDER BY id";
        return jdbcTemplate.query(sql, ROW_MAPPER, appCode);
    }

    /**
     * 保存告警规则
     */
    public AlertRule save(AlertRule rule) {
        if (rule.getId() == null) {
            // Insert
            String sql = "INSERT INTO alert_rules (rule_name, app_code, metric_name, operator, threshold, duration, severity, notification_type, notification_target, enabled, description) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    rule.getRuleName(),
                    rule.getAppCode(),
                    rule.getMetricName(),
                    rule.getOperator(),
                    rule.getThreshold(),
                    rule.getDuration(),
                    rule.getSeverity(),
                    rule.getNotificationType(),
                    rule.getNotificationTarget(),
                    rule.getEnabled(),
                    rule.getDescription()
            );
        } else {
            // Update
            String sql = "UPDATE alert_rules SET rule_name=?, app_code=?, metric_name=?, operator=?, threshold=?, duration=?, severity=?, notification_type=?, notification_target=?, enabled=?, description=? WHERE id=?";
            jdbcTemplate.update(sql,
                    rule.getRuleName(),
                    rule.getAppCode(),
                    rule.getMetricName(),
                    rule.getOperator(),
                    rule.getThreshold(),
                    rule.getDuration(),
                    rule.getSeverity(),
                    rule.getNotificationType(),
                    rule.getNotificationTarget(),
                    rule.getEnabled(),
                    rule.getDescription(),
                    rule.getId()
            );
        }
        return rule;
    }

    /**
     * 删除告警规则
     */
    public void deleteById(Long id) {
        String sql = "DELETE FROM alert_rules WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    /**
     * 根据ID查询告警规则
     */
    public AlertRule findById(Long id) {
        String sql = "SELECT * FROM alert_rules WHERE id = ?";
        List<AlertRule> rules = jdbcTemplate.query(sql, ROW_MAPPER, id);
        return rules.isEmpty() ? null : rules.get(0);
    }
}
