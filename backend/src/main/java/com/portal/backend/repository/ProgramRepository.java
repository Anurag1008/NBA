package com.portal.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.Programs;


public interface ProgramRepository extends JpaRepository<Programs, Long> {
    List<Programs> findByDepartmentId(Long departmentId);
    Optional<Programs> findByDepartmentIdAndName(Long departmentId, String name);
    Optional<Programs> findByDepartmentIdAndCodeIgnoreCase(Long departmentId, String code);
    Optional<Programs> findByDepartmentIdAndNameIgnoreCase(Long departmentId, String name);
}
