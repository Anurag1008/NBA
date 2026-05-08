package com.portal.backend.payload.request;

import java.util.List;

import lombok.Data;

@Data
public class UpdateUserRolesRequest {
    private List<String> roles;
}
