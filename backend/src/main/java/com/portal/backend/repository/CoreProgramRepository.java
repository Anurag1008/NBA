package com.portal.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.CoreProgram;

public interface CoreProgramRepository extends JpaRepository<CoreProgram, Long> {
    List<CoreProgram> findByDepartmentCode(String departmentCode);
    Optional<CoreProgram> findByProgramCodeAndDepartmentCode(String programCode, String departmentCode);
    Optional<CoreProgram> findByProgramNameAndDepartmentCode(String programName, String departmentCode);
}
