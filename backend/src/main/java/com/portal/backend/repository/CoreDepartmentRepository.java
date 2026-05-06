package com.portal.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.CoreDepartment;

public interface CoreDepartmentRepository extends JpaRepository<CoreDepartment, Long> {
    Optional<CoreDepartment> findByCode(String code);
    Optional<CoreDepartment> findByNameAndCode(String name, String code);
    boolean existsByCode(String code);
}
