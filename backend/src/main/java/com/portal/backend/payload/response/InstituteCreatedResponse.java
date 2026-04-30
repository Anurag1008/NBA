package com.portal.backend.payload.response;

import lombok.Data;
@Data
public class InstituteCreatedResponse {
    private Long instituteId;
    private String message = "Institute Created Successfully";

    public InstituteCreatedResponse(Long ID) {
        instituteId = ID;
    }
}
