package com.portal.backend.entity;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class NbaFileAssignment {
  @Id
  private Long id;
  @Column(nullable = false)
  private Long assignedBy;
  @Column(nullable = false)
  private LocalTime assignedAt;
  @Column(nullable = false)
  private LocalDate dueDate;
  @Column(nullable = false)
  private String status;
  // User table
  @ManyToOne
  @JoinColumn(name = "user_id")
  private Users users;
  @ManyToOne
  @JoinColumn(name = "nba_file_id")
  private NbaFile nbaFile;
}
