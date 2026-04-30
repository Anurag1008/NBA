package com.portal.backend.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.Department;
import com.portal.backend.entity.Institute;
import com.portal.backend.payload.request.CreateDepartmentRequest;
import com.portal.backend.payload.response.DepartmentCreatedResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/department")
public class DepartmentController {

    @Autowired
    private InstituteRepository instituteRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    // user to create department under institute
    @PostMapping("/create-departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDepartments(
            @Valid @RequestBody CreateDepartmentRequest createDepartmentRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl loggedInUser = (UserDetailsImpl) auth.getPrincipal();
        if (!loggedInUser.getRoles().contains("ROLE_ADMIN")) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only ADMIN can create new Department!"));
        }
        Long id = createDepartmentRequest.getInstituteId();
        Institute institute = instituteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institute not found with id " + id));
        List<CreateDepartmentRequest.CreateDepartment> departments = createDepartmentRequest.getCreateDepartments();
        List<String> departmentNames= new ArrayList<>();
        for (CreateDepartmentRequest.CreateDepartment dept : departments) {
            Department department = new Department();
            department.setInstitute(institute);
            department.setCode(dept.getCode());
            department.setName(dept.getName());
            departmentNames.add(dept.getName());
            departmentRepository.save(department);
        }

        // This API response
        DepartmentCreatedResponse response = new DepartmentCreatedResponse();
        response.setInstituteId(institute.getId());
        response.setDepartmentName(departmentNames);
        return ResponseEntity.ok(response);
    }

}
