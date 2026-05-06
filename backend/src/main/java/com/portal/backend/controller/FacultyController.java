package com.portal.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

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

import com.portal.backend.entity.UserInfo;
import com.portal.backend.payload.request.AddUserDetailRequest;
import com.portal.backend.repository.NbaFileAssignmentRepository;
import com.portal.backend.repository.UserInfoRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.services.UserDetailsImpl;

import jakarta.validation.Valid;



@RestController
@RequestMapping("/faculty")
public class FacultyController {

    @Autowired
    UserInfoRepository userInfoRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    NbaFileAssignmentRepository assignmentRepository;

    @GetMapping("/my-stats")
    public ResponseEntity<Map<String, Long>> myStats() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = ((UserDetailsImpl) auth.getPrincipal()).getEmail();

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total",     assignmentRepository.countByUsersEmail(email));
        stats.put("pending",   assignmentRepository.countByUsersEmailAndStatus(email, "PENDING"));
        stats.put("completed", assignmentRepository.countByUsersEmailAndStatus(email, "COMPLETED"));
        stats.put("overdue",   assignmentRepository.countByUsersEmailAndStatus(email, "OVERDUE"));
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasRole('FACULTY')")
    @PostMapping("/update-faculty-details") 
    public ResponseEntity<?> updateUserDetails(@Valid @RequestBody AddUserDetailRequest userDetailRequest) {
        // check user details from jwt and check wheather user is exits for not  -> precheck by the Authservice
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl User = (UserDetailsImpl) auth.getPrincipal();
        String email = User.getEmail();
        if(userRepository.existsByEmail(email) == false){
            return ResponseEntity
            .badRequest()
            .body("Error: User with email " + email + " not found.");
        }
        
        UserInfo userDetails = userInfoRepository.findByUsers(userRepository.findByEmail(email).get()).orElse(new UserInfo());
        userDetails.setFirstName(userDetailRequest.getFirstName());
        userDetails.setDateOfBirth(userDetailRequest.getDate_of_birth());
        userDetails.setDateOfJoining(userDetailRequest.getDate_of_joining());
        userDetails.setDesignation(userDetailRequest.getDesignation());
        userDetails.setEmpCode(userDetailRequest.getEmp_code());
        userDetails.setPhone(userDetailRequest.getPhone());
        userDetails.setUsers(userRepository.findByEmail(email).get());
        // if not then throw error
        // if yes then update the user details in user details table
        userInfoRepository.save(userDetails);   
        // return success message
        return ResponseEntity.ok("User details updated successfully!");
    }
}

