package org.xi.lt.apm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.xi.lt.apm.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByAccount(String account);

    List<User> findByStatusNot(String status);

    List<User> findByNameContainingOrAccountContaining(String name, String account);
}
