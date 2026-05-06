package com.portal.backend.repository;



import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.Department;


public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<List<Department>> findByInstituteId(Long instituteId);
    Optional<Department> findByInstituteIdAndName(Long instituteId, String name);
    Optional<Department> findByInstituteIdAndCodeIgnoreCase(Long instituteId, String code);
    Optional<Department> findByInstituteIdAndNameIgnoreCase(Long instituteId, String name);
}

