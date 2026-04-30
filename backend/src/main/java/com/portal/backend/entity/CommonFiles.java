package com.portal.backend.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
    

@Data
@Entity
public class CommonFiles {
  @Id
  private Long id;
  // (which type of file it is like P0 P1)
  @Column(nullable = false)
  private String type;
  @Column(nullable = false)
  private String description;
  @Column(nullable = false)
  private String cloudLink;
}
