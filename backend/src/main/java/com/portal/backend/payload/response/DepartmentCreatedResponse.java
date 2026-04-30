package com.portal.backend.payload.response;

import java.util.List;

import lombok.Data;

@Data
public class DepartmentCreatedResponse {
    public Long InstituteId;
    public List<String> departmentName;
}
