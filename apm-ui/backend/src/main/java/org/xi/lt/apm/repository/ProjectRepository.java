package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.Project;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByEnv(String env);

    List<Project> findByStatus(String status);

    List<Project> findByNameContaining(String name);
}
