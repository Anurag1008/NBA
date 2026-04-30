package com.portal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



@Data
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddUserRequestDto {
    private String email;
    private String password;
    private String role; 
}
