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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.Qualification;
import com.portal.backend.entity.UserInfo;
import com.portal.backend.entity.Users;
import com.portal.backend.payload.request.AddUserDetailRequest;
import com.portal.backend.payload.request.QualificationRequest;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.QualificationRepository;
import com.portal.backend.repository.UserInfoRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserProfileController {

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QualificationRepository qualificationRepository;

    @GetMapping("/me/details")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyDetails() {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        UserInfo info = userInfoRepository.findByUsers(user).orElse(null);
        return ResponseEntity.ok(toDto(user, info));
    }

    @PutMapping("/me/details")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateMyDetails(@Valid @RequestBody AddUserDetailRequest request) {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }

        UserInfo info = userInfoRepository.findByUsers(user).orElseGet(UserInfo::new);
        if (info.getId() == null) {
            info.setId(user.getId());
        }
        info.setFirstName(request.getFirstName());
        info.setDateOfBirth(request.getDate_of_birth());
        info.setDateOfJoining(request.getDate_of_joining());
        info.setDesignation(request.getDesignation());
        info.setEmpCode(request.getEmp_code());
        info.setPhone(request.getPhone());
        info.setUsers(user);
        if (info.getIsActive() == null) info.setIsActive(true);

        UserInfo saved = userInfoRepository.save(info);
        return ResponseEntity.ok(toDto(user, saved));
    }

    /* ── Qualifications ──────────────────────────────────────────── */

    @GetMapping("/me/qualifications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listMyQualifications() {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        List<Map<String, Object>> rows = qualificationRepository
                .findByUsersIdOrderByYearOfCompletionDesc(user.getId())
                .stream()
                .map(this::qualificationDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/me/qualifications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addMyQualification(@RequestBody QualificationRequest request) {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        ResponseEntity<?> err = validateQualification(request);
        if (err != null) return err;

        Qualification q = new Qualification();
        applyToEntity(q, request, user);
        Qualification saved = qualificationRepository.save(q);
        return ResponseEntity.ok(qualificationDto(saved));
    }

    @PutMapping("/me/qualifications/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateMyQualification(@PathVariable Long id,
                                                   @RequestBody QualificationRequest request) {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        Qualification q = qualificationRepository.findById(id).orElse(null);
        if (q == null || q.getUsers() == null || !q.getUsers().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Qualification not found."));
        }
        ResponseEntity<?> err = validateQualification(request);
        if (err != null) return err;

        applyToEntity(q, request, user);
        Qualification saved = qualificationRepository.save(q);
        return ResponseEntity.ok(qualificationDto(saved));
    }

    @DeleteMapping("/me/qualifications/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteMyQualification(@PathVariable Long id) {
        Users user = currentUser();
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        Qualification q = qualificationRepository.findById(id).orElse(null);
        if (q == null || q.getUsers() == null || !q.getUsers().getId().equals(user.getId())) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Qualification not found."));
        }
        qualificationRepository.delete(q);
        return ResponseEntity.ok(new MessageResponse("Qualification deleted."));
    }

    private ResponseEntity<?> validateQualification(QualificationRequest request) {
        if (request == null
                || request.getDegreeName() == null || request.getDegreeName().isBlank()
                || request.getUniversity() == null || request.getUniversity().isBlank()
                || request.getYearOfCompletion() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse(
                    "Error: degreeName, university and yearOfCompletion are required."));
        }
        return null;
    }

    private void applyToEntity(Qualification q, QualificationRequest r, Users user) {
        q.setDegreeName(r.getDegreeName().trim());
        q.setLevel(r.getLevel() != null ? r.getLevel().trim() : null);
        q.setYearOfCompletion(r.getYearOfCompletion());
        q.setUniversity(r.getUniversity().trim());
        q.setUsers(user);
    }

    private Map<String, Object> qualificationDto(Qualification q) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", q.getId());
        body.put("degreeName", q.getDegreeName());
        body.put("level", q.getLevel());
        body.put("yearOfCompletion", q.getYearOfCompletion());
        body.put("university", q.getUniversity());
        return body;
    }

    private Users currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            return null;
        }
        return userRepository.findByEmail(principal.getEmail()).orElse(null);
    }

    private Map<String, Object> toDto(Users user, UserInfo info) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", user.getUsername());
        body.put("email", user.getEmail());
        body.put("firstName", info != null ? info.getFirstName() : null);
        body.put("dateOfBirth", info != null ? info.getDateOfBirth() : null);
        body.put("dateOfJoining", info != null ? info.getDateOfJoining() : null);
        body.put("designation", info != null ? info.getDesignation() : null);
        body.put("empCode", info != null ? info.getEmpCode() : null);
        body.put("phone", info != null ? info.getPhone() : null);
        return body;
    }
}
