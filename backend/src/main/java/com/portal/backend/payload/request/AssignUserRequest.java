package com.portal.backend.payload.request;

import lombok.Data;

@Data
public class AssignUserRequest {
    private Long departmentId;
    private Long programId;
}
