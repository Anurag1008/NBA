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
public class AcadmicYear {
  @Id
  private Long id;
  @Column(nullable = false)
  private String code;
  @Column(nullable = false)
  private LocalDate startDate;
  @Column(nullable = false)
  private LocalDate endDate;
  @Column(nullable = false)
  private Boolean isCurrent;
  @ManyToOne
  @JoinColumn(name = "institute_id")
  private Institute institute;
}