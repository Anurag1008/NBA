package com.portal.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.portal.backend.entity.RefreshToken;
import com.portal.backend.entity.Users;


public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(Users user);
    int deleteByUser(Users user);
    void deleteByToken(String token);
}
