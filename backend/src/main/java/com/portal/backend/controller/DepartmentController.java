package com.portal.backend.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.CoreDepartment;
import com.portal.backend.entity.Department;
import com.portal.backend.entity.Institute;
import com.portal.backend.payload.request.CreateDepartmentRequest;
import com.portal.backend.payload.response.DepartmentCreatedResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.CoreDepartmentRepository;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/department")
public class DepartmentController {

    @Autowired
    private InstituteRepository instituteRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CoreDepartmentRepository coreDepartmentRepository;

    @Autowired
    private UserRepository userRepository;

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
        List<String> departmentNames = new ArrayList<>();
        for (CreateDepartmentRequest.CreateDepartment dept : departments) {
            CoreDepartment core = coreDepartmentRepository.findByCode(dept.getCode()).orElse(null);
            if (core == null) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: department code '" + dept.getCode() + "' is not in the core catalog"));
            }
            if (!core.getName().equalsIgnoreCase(dept.getName())) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: department name '" + dept.getName() + "' does not match core catalog (expected '"
                                + core.getName() + "' for code " + dept.getCode() + ")"));
            }
            Department department = new Department();
            department.setInstitute(institute);
            department.setCode(core.getCode());
            department.setName(core.getName());
            departmentNames.add(core.getName());
            departmentRepository.save(department);
        }

        // This API response
        DepartmentCreatedResponse response = new DepartmentCreatedResponse();
        response.setInstituteId(institute.getId());
        response.setDepartmentName(departmentNames);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> departmentDetail(@PathVariable Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Department not found with id " + id));
        }

        List<Map<String, Object>> programs = department.getProgramsList().stream()
                .map(p -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", p.getId());
                    row.put("name", p.getName());
                    row.put("level", p.getLevel());
                    row.put("isActive", p.getIsActive());
                    row.put("userCount", userRepository.countByProgramsId(p.getId()));
                    return row;
                })
                .collect(Collectors.toList());

        Institute institute = department.getInstitute();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", department.getId());
        body.put("name", department.getName());
        body.put("code", department.getCode());
        body.put("isActive", department.getIsActive());
        body.put("instituteId", institute != null ? institute.getId() : null);
        body.put("instituteName", institute != null ? institute.getName() : null);
        body.put("programs", programs);
        body.put("programCount", programs.size());
        body.put("userCount", userRepository.countByDepartmentId(department.getId()));

        return ResponseEntity.ok(body);
    }
}
