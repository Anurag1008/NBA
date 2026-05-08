package com.portal.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.portal.backend.entity.Users;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByEmail(String email);
    Optional<Users> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    long countByProgramsId(Long programId);
    long countByDepartmentId(Long departmentId);
    long countByInstituteId(Long instituteId);
    List<Users> findByProgramsId(Long programId);

    List<Users> findByInstituteId(Long instituteId);
    List<Users> findByInstituteIdAndDepartmentId(Long instituteId, Long departmentId);
    List<Users> findByInstituteIdAndProgramsId(Long instituteId, Long programId);
}
