package com.portal.backend.payload.request;

import java.util.List;
import lombok.Data;

@Data
public class AdminCreateUsersRequest {
    private List<UserEntry> users;

    @Data
    public static class UserEntry {
        private String email;
        private String role;
        private Long instituteId;
    }
}
