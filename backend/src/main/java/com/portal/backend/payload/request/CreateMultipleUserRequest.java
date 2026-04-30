package com.portal.backend.payload.request;

import java.util.List;

import lombok.Data;

@Data
public class CreateMultipleUserRequest {
    private List<String> user_email;
}
