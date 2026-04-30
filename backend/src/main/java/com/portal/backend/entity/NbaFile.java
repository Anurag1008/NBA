package com.portal.backend.entity;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Data
@Entity
public class NbaFile {
  @Id
  private Long id;
  @Column(nullable = false)
  private String code;
  @Column(nullable = false)
  private String title;
  private String description;
  @Column(nullable = false)
  private Boolean isActive;
  @Column(nullable = false)
  private String fileLink;
  @ManyToOne
  @JoinColumn(name = "program_id")
  private Programs programs;
  @ManyToOne
  @JoinColumn(name = "institute_id")
  private Institute institute;
  @ManyToOne
  @JoinColumn(name = "department_id")
  private Department department;
  @OneToMany(mappedBy = "nbaFile")
  private List<NbaFileAssignment> nbaFileAssignmentList = new ArrayList<>();
}
