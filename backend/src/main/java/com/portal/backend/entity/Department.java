package com.portal.backend.entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Data
@Entity
public class Department {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false)
  private String name;
  private String code;
  @Column(nullable = false)
  private Boolean isActive = true;
  @ManyToOne
  @JoinColumn(name = "institute_id")
  @JsonBackReference
  private Institute institute;
  @OneToMany(mappedBy = "department")
  @JsonBackReference // ✅ prevents infinite recursion
  private List<Programs> programsList = new ArrayList<>();
}
