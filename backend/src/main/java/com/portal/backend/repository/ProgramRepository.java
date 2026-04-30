package com.portal.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.Programs;


public interface ProgramRepository extends JpaRepository<Programs, Long> {
    
}