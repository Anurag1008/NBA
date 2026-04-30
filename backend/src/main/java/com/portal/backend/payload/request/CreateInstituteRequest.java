package com.portal.backend.payload.request;
import lombok.Data;

@Data
public class CreateInstituteRequest {
    private String name;
    private String code;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String pincode;
}
