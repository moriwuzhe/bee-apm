package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.Application;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByProjectId(Long projectId);

    List<Application> findByStatus(String status);

    List<Application> findByNameContaining(String name);
    
    Integer countByProjectId(Long projectId);
    
    void deleteByProjectId(Long projectId);
}
