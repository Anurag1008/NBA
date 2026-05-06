package com.portal.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.portal.backend.entity.NbaFileAssignment;

@Repository
public interface NbaFileAssignmentRepository extends JpaRepository<NbaFileAssignment, Long> {
    long countByUsersEmail(String email);
    long countByUsersEmailAndStatus(String email, String status);
}
