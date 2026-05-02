package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.AlertRule;

import java.util.List;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    List<AlertRule> findByStatus(String status);
    List<AlertRule> findByAppName(String appName);
    List<AlertRule> findByLevel(String level);
    List<AlertRule> findByMetric(String metric);
}
