package com.portal.backend.entity;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class Qualification {
  @Id
  private Long id;
  @Column(nullable = false)
  private String degreeName;
  // {ENUM  UG PG PHD Diploma}}
  private String level;
  @Column(nullable = false)
  private LocalDate yearOfCompletion;
  @Column(nullable = false)
  private String university;
  // User table
  @ManyToOne
  @JoinColumn(name = "user_id")
  private Users users;
}
