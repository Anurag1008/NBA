package com.portal.backend.dto;

import java.time.LocalDateTime;
  
import com.portal.backend.entity.Roles;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data   
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String password; // In real applications, avoid exposing passwords in DTOs
    private Roles role; // e.g., ADMIN, PRINCIPAL, NBA_COORDINATOR_HEAD, HOD_DEPT_LEVEL, NBA_COORDINATOR_DEPT_LEVEL, FACULTY
    private Long createdByUserID;
    private LocalDateTime createdAt; // ISO 8601 format
    private LocalDateTime updatedAt; // ISO 8601 format
}
