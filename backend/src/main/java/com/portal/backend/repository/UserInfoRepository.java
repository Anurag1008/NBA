package com.portal.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.portal.backend.entity.UserInfo;
import com.portal.backend.entity.Users;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, Long> {
    Optional<UserInfo> findByUsersId(Long id);
    Optional<UserInfo> findByUsers(Users users);
}
