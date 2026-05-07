package com.portal.backend.payload.request;

import java.time.LocalDate;

import lombok.Data;

@Data
public class QualificationRequest {
    private String degreeName;
    private String level;
    private LocalDate yearOfCompletion;
    private String university;
}
