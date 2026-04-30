package com.portal.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.Institute;

public interface InstituteRepository extends JpaRepository<Institute, Long>{
    // Find by unique fields
    Optional<Institute> findByName(String name);
    Optional<Institute> findByCode(String code);

    // Existence checks
    Boolean existsByName(String name);
    Boolean existsByCode(String code);

    // Example if you want by city/state (not unique usually)
    Optional<Institute> findByCity(String city);
    Optional<Institute> findByState(String state);
}

