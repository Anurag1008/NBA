package com.portal.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "core_program",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"program_code", "department_code"})
    },
    indexes = {
        @Index(name = "idx_core_program_dept_code", columnList = "department_code")
    })
public class CoreProgram {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Size(max = 100)
  @Column(name = "program_name", nullable = false, length = 100)
  private String programName;

  @NotBlank
  @Size(max = 20)
  @Column(name = "program_code", nullable = false, length = 20)
  private String programCode;

  @NotBlank
  @Size(max = 100)
  @Column(name = "department_name", nullable = false, length = 100)
  private String departmentName;

  @NotBlank
  @Size(max = 20)
  @Column(name = "department_code", nullable = false, length = 20)
  private String departmentCode;
}
