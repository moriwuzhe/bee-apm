package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.Role;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    List<Role> findByIsSystemFalse();

    List<Role> findByNameContaining(String name);
    
    Optional<Role> findByName(String name);
}
