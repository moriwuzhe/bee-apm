package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.Release;

import java.util.List;

@Repository
public interface ReleaseRepository extends JpaRepository<Release, Long> {

    List<Release> findByAppName(String appName);

    List<Release> findByEnv(String env);

    List<Release> findByStatus(String status);
}
