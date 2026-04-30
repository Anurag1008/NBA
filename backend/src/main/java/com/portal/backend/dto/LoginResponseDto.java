package com.portal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {
    private String jwt;  // (optional, for JWT)
    private Long userId; // (optional, for user identification)
}
