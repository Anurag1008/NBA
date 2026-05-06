package com.portal.backend.controller;

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

import com.portal.backend.entity.Institute;
import com.portal.backend.payload.request.CreateInstituteRequest;
import com.portal.backend.payload.response.InstituteCreatedResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/institute")
public class InstituteController {

    @Autowired
    private InstituteRepository instituteRepository;

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/show-institute")
    public ResponseEntity<?> showInstitute() {
        List<Institute> institutes = instituteRepository.findAll();

        if (institutes.isEmpty()) {
            return ResponseEntity.ok(new MessageResponse("No institutes found."));
        }

        return ResponseEntity.ok(institutes);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> instituteDetail(@PathVariable Long id) {
        Institute institute = instituteRepository.findById(id).orElse(null);
        if (institute == null) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Institute not found with id " + id));
        }

        List<Map<String, Object>> departments = institute.getDepartmentList().stream()
                .map(d -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", d.getId());
                    row.put("name", d.getName());
                    row.put("code", d.getCode());
                    row.put("isActive", d.getIsActive());
                    row.put("programCount", d.getProgramsList() != null ? d.getProgramsList().size() : 0);
                    row.put("userCount", userRepository.countByDepartmentId(d.getId()));
                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", institute.getId());
        body.put("name", institute.getName());
        body.put("code", institute.getCode());
        body.put("addressLine1", institute.getAddressLine1());
        body.put("addressLine2", institute.getAddressLine2());
        body.put("city", institute.getCity());
        body.put("state", institute.getState());
        body.put("country", institute.getCountry());
        body.put("pincode", institute.getPincode());
        body.put("isActive", institute.getIsActive());
        body.put("createdAt", institute.getCreatedAt());
        body.put("departments", departments);
        body.put("departmentCount", departments.size());
        body.put("programCount",
                institute.getDepartmentList().stream()
                        .mapToInt(d -> d.getProgramsList() != null ? d.getProgramsList().size() : 0)
                        .sum());
        body.put("userCount", userRepository.countByInstituteId(institute.getId()));

        return ResponseEntity.ok(body);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-institute")
    public ResponseEntity<?> createInstitute(@Valid @RequestBody CreateInstituteRequest createInstituteRequest) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();

        if (!user.getRoles().contains("ROLE_ADMIN")) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Only ADMIN can create new Institute!"));
        }

        String name = createInstituteRequest.getName();
        String code = createInstituteRequest.getCode();

        if (instituteRepository.existsByName(name)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Institute already exists with name: " + name));
        }
        if (instituteRepository.existsByCode(code)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Institute already exists with code: " + code));
        }

        // create new institute using constructor with request fields
        Institute newInstitute = new Institute(
                createInstituteRequest.getName(),
                createInstituteRequest.getCode(),
                createInstituteRequest.getAddressLine1(),
                createInstituteRequest.getAddressLine2(),
                createInstituteRequest.getCity(),
                createInstituteRequest.getState(),
                createInstituteRequest.getCountry(),
                createInstituteRequest.getPincode());

        instituteRepository.save(newInstitute);

        return ResponseEntity.ok(new InstituteCreatedResponse(newInstitute.getId()));
    }
}
