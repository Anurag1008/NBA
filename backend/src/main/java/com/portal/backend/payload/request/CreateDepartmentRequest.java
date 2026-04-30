package com.portal.backend.payload.request;

import java.util.List;

import lombok.Data;

@Data
public class CreateDepartmentRequest {
    private Long instituteId;
    private List<CreateDepartment> createDepartments;

    @Data
    public static class CreateDepartment {
        private String code;
        private String name;
    }
}
