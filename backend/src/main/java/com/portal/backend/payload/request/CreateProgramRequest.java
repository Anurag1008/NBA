package com.portal.backend.payload.request;
import java.util.List;

import lombok.Data;

@Data
public class CreateProgramRequest {
    private String departmentName;
    private Long instituteId;
    private List<CreateProgram> programs;
    
    @Data
    public static  class CreateProgram {
        public String name;
        public String code;
        public String level;
    }
}
