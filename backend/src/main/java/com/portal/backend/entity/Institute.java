package com.portal.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Data
@Entity
public class Institute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String code;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String pincode;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean isActive;

    @OneToMany(mappedBy = "institute")
    @JsonManagedReference
    private List<Department> departmentList = new ArrayList<>();

    @OneToMany(mappedBy = "institute")
    private List<AcadmicYear> acadmicYearList = new ArrayList<>();

    public Institute() {
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
    }

    public Institute(String name, String code, String addressLine1, String addressLine2, 
                     String city, String state, String country, String pincode) {
        this.name = name;
        this.code = code;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.state = state;
        this.country = country;
        this.pincode = pincode;
        this.isActive = true;             // Initialize isActive
        this.createdAt = LocalDateTime.now(); // Initialize createdAt
    }
}
