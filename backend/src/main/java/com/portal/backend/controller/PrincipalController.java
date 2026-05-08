package com.portal.backend.controller;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.Department;
import com.portal.backend.entity.ERole;
import com.portal.backend.entity.Institute;
import com.portal.backend.entity.Programs;
import com.portal.backend.entity.Roles;
import com.portal.backend.entity.Users;
import com.portal.backend.payload.request.AssignUserRequest;
import com.portal.backend.payload.request.UpdateUserRolesRequest;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.ProgramRepository;
import com.portal.backend.repository.RoleRepository;
import com.portal.backend.repository.UserRepository;
import com.portal.backend.security.services.UserDetailsImpl;

@RestController
@RequestMapping("/principal")
public class PrincipalController {

    private static final Set<ERole> RESTRICTED_ROLES = Set.of(ERole.ROLE_ADMIN, ERole.ROLE_PRINCIPAL);

    /** Roles whose holders are NOT assigned to a specific department/program. */
    private static final Set<ERole> NON_ASSIGNABLE_ROLES = Set.of(
            ERole.ROLE_ADMIN,
            ERole.ROLE_PRINCIPAL,
            ERole.ROLE_NBA_COORDINATOR);

    private static final Set<ERole> ASSIGNABLE_ROLES = Set.of(
            ERole.ROLE_FACULTY,
            ERole.ROLE_HOD,
            ERole.ROLE_NBA_COORDINATOR,
            ERole.ROLE_NBA_COORDINATOR_DEPT);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final ProgramRepository programRepository;

    public PrincipalController(UserRepository userRepository,
                               RoleRepository roleRepository,
                               DepartmentRepository departmentRepository,
                               ProgramRepository programRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.programRepository = programRepository;
    }

    /* ── Context ─────────────────────────────────────────────────── */

    @GetMapping("/me/context")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> myContext() {
        Users me = currentUser();
        if (me == null) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Current user not found."));
        }
        Institute inst = me.getInstitute();
        if (inst == null) {
            return ResponseEntity.status(400).body(new MessageResponse(
                    "Error: Principal account is not assigned to any institute."));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("instituteId", inst.getId());
        body.put("instituteName", inst.getName());
        body.put("instituteCode", inst.getCode());
        return ResponseEntity.ok(body);
    }

    /* ── Departments / Programs (institute-scoped) ───────────────── */

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> listDepartments() {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        List<Department> depts = departmentRepository.findByInstituteId(inst.getId()).orElseGet(List::of);
        List<Map<String, Object>> body = depts.stream().map(d -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getId());
            row.put("name", d.getName());
            row.put("code", d.getCode());
            row.put("isActive", d.getIsActive());
            row.put("userCount", userRepository.countByDepartmentId(d.getId()));
            row.put("programCount", d.getProgramsList() == null ? 0 : d.getProgramsList().size());
            return row;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/departments/{departmentId}/programs")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> listPrograms(@PathVariable Long departmentId) {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        Department dept = departmentRepository.findById(departmentId).orElse(null);
        if (dept == null || dept.getInstitute() == null
                || !dept.getInstitute().getId().equals(inst.getId())) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Department not found in your institute."));
        }
        List<Programs> programs = programRepository.findByDepartmentId(departmentId);
        List<Map<String, Object>> body = programs.stream().map(p -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.getId());
            row.put("name", p.getName());
            row.put("code", p.getCode());
            row.put("level", p.getLevel());
            row.put("isActive", p.getIsActive());
            row.put("userCount", userRepository.countByProgramsId(p.getId()));
            return row;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(body);
    }

    /* ── Users (department/program filterable) ───────────────────── */

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> listInstituteUsers(
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "programId", required = false) Long programId) {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        List<Users> users;
        if (programId != null) {
            users = userRepository.findByInstituteIdAndProgramsId(inst.getId(), programId);
        } else if (departmentId != null) {
            users = userRepository.findByInstituteIdAndDepartmentId(inst.getId(), departmentId);
        } else {
            users = userRepository.findByInstituteId(inst.getId());
        }

        boolean hideRestricted = isCoordinatorOnly();
        List<Map<String, Object>> body = users.stream()
                .filter(u -> !hideRestricted || !hasAnyRestrictedRole(u))
                .map(this::toUserDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(body);
    }

    /* ── Update roles (multi-role, blocks ADMIN/PRINCIPAL) ───────── */

    @PutMapping("/users/{userId}/roles")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> updateUserRoles(@PathVariable Long userId,
                                             @RequestBody UpdateUserRolesRequest request) {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        Users me = currentUser();
        if (me != null && me.getId().equals(userId)) {
            return ResponseEntity.status(400)
                    .body(new MessageResponse("Error: You cannot change your own roles."));
        }

        Users target = userRepository.findById(userId).orElse(null);
        if (target == null
                || target.getInstitute() == null
                || !target.getInstitute().getId().equals(inst.getId())) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("User not found in your institute."));
        }

        if (target.getRoles() != null && target.getRoles().stream()
                .anyMatch(r -> RESTRICTED_ROLES.contains(r.getName()))) {
            return ResponseEntity.status(403).body(new MessageResponse(
                    "Error: Cannot change roles of an Admin or Principal user."));
        }

        if (request == null || request.getRoles() == null || request.getRoles().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: At least one role is required."));
        }

        List<ERole> requested = new ArrayList<>();
        for (String raw : request.getRoles()) {
            if (raw == null || raw.isBlank()) continue;
            String normalized = raw.trim().toUpperCase().replace(' ', '_');
            if (!normalized.startsWith("ROLE_")) normalized = "ROLE_" + normalized;
            ERole eRole;
            try {
                eRole = ERole.valueOf(normalized);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Unknown role '" + raw + "'."));
            }
            if (RESTRICTED_ROLES.contains(eRole)) {
                return ResponseEntity.status(403).body(new MessageResponse(
                        "Error: Principal cannot assign role " + eRole.name() + "."));
            }
            if (!ASSIGNABLE_ROLES.contains(eRole)) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: Role " + eRole.name() + " is not assignable by a principal."));
            }
            if (!requested.contains(eRole)) requested.add(eRole);
        }
        if (requested.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: At least one valid role is required."));
        }

        List<Roles> roleEntities = new ArrayList<>();
        for (ERole eRole : requested) {
            Roles r = roleRepository.findByName(eRole).orElse(null);
            if (r == null) {
                return ResponseEntity.status(500).body(new MessageResponse(
                        "Error: Role lookup failed for " + eRole.name() + "."));
            }
            roleEntities.add(r);
        }

        target.setRoles(roleEntities);
        userRepository.save(target);

        Map<String, Object> body = toUserDto(target);
        body.put("message", "Roles updated successfully.");
        return ResponseEntity.ok(body);
    }

    /* ── Assign user to department / program ─────────────────────── */

    @PutMapping("/users/{userId}/assignment")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> updateUserAssignment(@PathVariable Long userId,
                                                  @RequestBody AssignUserRequest request) {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        Users me = currentUser();
        if (me != null && me.getId().equals(userId)) {
            return ResponseEntity.status(400)
                    .body(new MessageResponse("Error: You cannot change your own assignment."));
        }

        Users target = userRepository.findById(userId).orElse(null);
        if (target == null
                || target.getInstitute() == null
                || !target.getInstitute().getId().equals(inst.getId())) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("User not found in your institute."));
        }
        if (target.getRoles() != null && target.getRoles().stream()
                .anyMatch(r -> NON_ASSIGNABLE_ROLES.contains(r.getName()))) {
            return ResponseEntity.status(403).body(new MessageResponse(
                    "Error: Admin, Principal and NBA Coordinator users are not assigned to a department or program."));
        }

        Department department = null;
        if (request != null && request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            if (department == null
                    || department.getInstitute() == null
                    || !department.getInstitute().getId().equals(inst.getId())) {
                return ResponseEntity.status(404)
                        .body(new MessageResponse("Department not found in your institute."));
            }
        }

        Programs program = null;
        if (request != null && request.getProgramId() != null) {
            if (department == null) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: Department is required when assigning a program."));
            }
            program = programRepository.findById(request.getProgramId()).orElse(null);
            if (program == null
                    || program.getDepartment() == null
                    || !program.getDepartment().getId().equals(department.getId())) {
                return ResponseEntity.status(404).body(new MessageResponse(
                        "Program not found under the selected department."));
            }
        }

        target.setDepartment(department);
        target.setPrograms(program);
        userRepository.save(target);

        Map<String, Object> body = toUserDto(target);
        body.put("message", "Assignment updated successfully.");
        return ResponseEntity.ok(body);
    }

    /* ── Programs file (placeholder download) ────────────────────── */

    @GetMapping("/departments/{departmentId}/programs-file")
    @PreAuthorize("hasAnyRole('PRINCIPAL','NBA_COORDINATOR')")
    public ResponseEntity<?> downloadDepartmentProgramsFile(@PathVariable Long departmentId) {
        Institute inst = requirePrincipalInstitute();
        if (inst == null) return notInInstitute();

        Department dept = departmentRepository.findById(departmentId).orElse(null);
        if (dept == null || dept.getInstitute() == null
                || !dept.getInstitute().getId().equals(inst.getId())) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Department not found in your institute."));
        }

        List<Programs> programs = programRepository.findByDepartmentId(departmentId);
        StringBuilder sb = new StringBuilder();
        sb.append("Institute,").append(safe(inst.getName())).append('\n');
        sb.append("Department,").append(safe(dept.getName()))
          .append(" (").append(safe(dept.getCode())).append(")\n\n");
        sb.append("program_code,program_name,level,active,user_count\n");
        for (Programs p : programs) {
            sb.append(safe(p.getCode())).append(',')
              .append(safe(p.getName())).append(',')
              .append(safe(p.getLevel())).append(',')
              .append(p.getIsActive() != null && p.getIsActive() ? "yes" : "no").append(',')
              .append(userRepository.countByProgramsId(p.getId())).append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);

        String safeDept = (dept.getCode() != null && !dept.getCode().isBlank())
                ? dept.getCode().replaceAll("[^A-Za-z0-9_-]", "_")
                : ("dept_" + dept.getId());
        String filename = "programs_" + safeDept + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=utf-8"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    /* ── helpers ─────────────────────────────────────────────────── */

    private Map<String, Object> toUserDto(Users u) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", u.getId());
        row.put("username", u.getUsername());
        row.put("email", u.getEmail());
        row.put("roles", u.getRoles() == null ? List.of()
                : u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()));
        row.put("departmentId", u.getDepartment() != null ? u.getDepartment().getId() : null);
        row.put("departmentName", u.getDepartment() != null ? u.getDepartment().getName() : null);
        row.put("programId", u.getPrograms() != null ? u.getPrograms().getId() : null);
        row.put("programName", u.getPrograms() != null ? u.getPrograms().getName() : null);
        boolean restricted = u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> RESTRICTED_ROLES.contains(r.getName()));
        boolean nonAssignable = u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> NON_ASSIGNABLE_ROLES.contains(r.getName()));
        row.put("editable", !restricted);
        row.put("assignable", !nonAssignable);
        return row;
    }

    private Users currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            return null;
        }
        return userRepository.findByEmail(principal.getEmail()).orElse(null);
    }

    private Institute requirePrincipalInstitute() {
        Users me = currentUser();
        if (me == null) return null;
        return me.getInstitute();
    }

    private static boolean isCoordinatorOnly() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        Set<String> roles = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());
        return roles.contains("ROLE_NBA_COORDINATOR")
                && !roles.contains("ROLE_PRINCIPAL")
                && !roles.contains("ROLE_ADMIN");
    }

    private static boolean hasAnyRestrictedRole(Users u) {
        return u.getRoles() != null
                && u.getRoles().stream().anyMatch(r -> RESTRICTED_ROLES.contains(r.getName()));
    }

    private static ResponseEntity<?> notInInstitute() {
        return ResponseEntity.status(400).body(new MessageResponse(
                "Error: Principal account is not assigned to any institute."));
    }

    private static String safe(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
