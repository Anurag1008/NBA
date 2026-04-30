package com.portal.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.Institute;
import com.portal.backend.payload.request.CreateInstituteRequest;
import com.portal.backend.payload.response.InstituteCreatedResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/institute")
public class InstituteController {

    @Autowired
    private InstituteRepository instituteRepository;

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
