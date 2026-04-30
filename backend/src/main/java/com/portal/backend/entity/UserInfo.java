package com.portal.backend.entity;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Data
@Entity
public class UserInfo {
  @Id
  private Long id;
  @Column(nullable = false)
  private String firstName;
  @Column(nullable = false)
  private LocalDate dateOfBirth;
  @Column(nullable = false)
  private LocalDate dateOfJoining;
  @Column(nullable = false)
  private String designation;
  private String empCode;
  private String phone;
  @Column(nullable = false)
  private Boolean isActive;
  @Column(nullable = false)
  private LocalTime createdAt;
  // User table
  @OneToOne
  @JoinColumn(name = "user_id")
  private Users users;

  public UserInfo() {
      this.createdAt = LocalTime.now();
      this.isActive = true; 
  }
}
