package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.Metric;

import java.util.List;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Long> {

    List<Metric> findByAppNameAndMetricTypeOrderByTimePointDesc(String appName, String metricType);

    List<Metric> findByAppNameAndMetricTypeAndTimePointGreaterThanEqualOrderByTimePointAsc(String appName, String metricType, Long startTime);
}
