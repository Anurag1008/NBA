package com.portal.backend.entity;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

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
public class Programs {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false)
  private String name;
  @Column(nullable = false)
  private String level;
  @Column(nullable = false)
  private Boolean isActive = true;
  @ManyToOne
  @JoinColumn(name = "department_id")
  @JsonManagedReference // ✅ paired with @JsonBackReference
  private Department department;
  @ManyToOne
  @JoinColumn(name = "institute_id")
  private Institute institute;
  @OneToMany(mappedBy = "programs")
  private List<NbaFile> nbaFileList = new ArrayList<>();
  // User table
  @OneToMany(mappedBy = "programs")
  private List<Users> usersList = new ArrayList<>();
}
