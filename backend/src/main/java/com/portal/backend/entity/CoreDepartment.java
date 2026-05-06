package com.portal.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "core_department", uniqueConstraints = {
    @UniqueConstraint(columnNames = "code")
})
public class CoreDepartment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Size(max = 100)
  @Column(nullable = false, length = 100)
  private String name;

  @NotBlank
  @Size(max = 20)
  @Column(nullable = false, length = 20)
  private String code;
}
