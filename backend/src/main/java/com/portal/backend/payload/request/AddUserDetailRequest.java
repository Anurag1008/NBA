package com.portal.backend.payload.request;
import java.time.LocalDate;

import lombok.Data;

@Data
public class AddUserDetailRequest {
    private String firstName;
    private LocalDate date_of_birth;
    private LocalDate date_of_joining;
    private String designation;
    private String emp_code;
    private String phone;
}


