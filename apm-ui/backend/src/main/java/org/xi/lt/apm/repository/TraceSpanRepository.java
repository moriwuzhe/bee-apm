package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.TraceSpan;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TraceSpanRepository extends JpaRepository<TraceSpan, Long> {

    List<TraceSpan> findByTraceId(String traceId);

    List<TraceSpan> findByAppName(String appName);

    List<TraceSpan> findBySpanType(String spanType);

    List<TraceSpan> findByIpAddress(String ipAddress);

    @Query("SELECT s FROM TraceSpan s WHERE s.appName = :appName AND s.timestamp BETWEEN :startTime AND :endTime ORDER BY s.timestamp DESC")
    List<TraceSpan> findByAppNameAndTimeRange(
        @Param("appName") String appName,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT s FROM TraceSpan s WHERE s.appName = :appName AND s.spanType = :spanType AND s.timestamp BETWEEN :startTime AND :endTime ORDER BY s.timestamp DESC")
    List<TraceSpan> findByAppNameAndSpanTypeAndTimeRange(
        @Param("appName") String appName,
        @Param("spanType") String spanType,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT COUNT(s) FROM TraceSpan s WHERE s.appName = :appName AND s.timestamp >= :since")
    Long countByAppNameSince(@Param("appName") String appName, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(s.duration) FROM TraceSpan s WHERE s.appName = :appName AND s.timestamp >= :since")
    Double avgDurationByAppNameSince(@Param("appName") String appName, @Param("since") LocalDateTime since);

    @Query("SELECT s FROM TraceSpan s WHERE s.timestamp >= :since ORDER BY s.timestamp DESC")
    List<TraceSpan> findRecent(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM TraceSpan s WHERE s.timestamp >= :since")
    Long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM TraceSpan s WHERE s.success = :success AND s.timestamp >= :since")
    Long countBySuccessSince(@Param("success") Boolean success, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(s.duration) FROM TraceSpan s WHERE s.timestamp >= :since")
    Double avgDurationSince(@Param("since") LocalDateTime since);

    @Query("SELECT MAX(s.duration) FROM TraceSpan s WHERE s.timestamp >= :since")
    Long maxDurationSince(@Param("since") LocalDateTime since);

    @Query("SELECT MIN(s.duration) FROM TraceSpan s WHERE s.timestamp >= :since")
    Long minDurationSince(@Param("since") LocalDateTime since);

    @Query("SELECT s.appName, COUNT(s) FROM TraceSpan s WHERE s.timestamp >= :since GROUP BY s.appName ORDER BY COUNT(s) DESC")
    List<Object[]> countByAppNameSince(@Param("since") LocalDateTime since);

    @Query("SELECT DISTINCT s.appName FROM TraceSpan s WHERE s.timestamp >= :since")
    List<String> findDistinctAppNamesSince(@Param("since") LocalDateTime since);
}
