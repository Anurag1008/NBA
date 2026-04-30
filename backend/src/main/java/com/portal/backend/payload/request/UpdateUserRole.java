package com.portal.backend.payload.request;

import java.util.HashSet;
import java.util.Set;

import lombok.Data;

@Data
public class UpdateUserRole {
    private String email;
    private Set<String> roles = new HashSet<>();
}
