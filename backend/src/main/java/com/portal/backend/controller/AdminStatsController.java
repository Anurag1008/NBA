package com.portal.backend.controller;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.portal.backend.entity.Department;
import com.portal.backend.entity.ERole;
import com.portal.backend.entity.Institute;
import com.portal.backend.entity.Programs;
import com.portal.backend.entity.Roles;
import com.portal.backend.entity.Users;
import com.portal.backend.payload.request.AdminCreateUsersRequest;
import com.portal.backend.payload.response.AdminStatsResponse;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.CoreDepartmentRepository;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.repository.ProgramRepository;
import com.portal.backend.repository.RoleRepository;
import com.portal.backend.repository.UserRepository;

@RestController
@RequestMapping("/admin")
public class AdminStatsController {

    private final InstituteRepository instituteRepository;
    private final DepartmentRepository departmentRepository;
    private final CoreDepartmentRepository coreDepartmentRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;

    public AdminStatsController(InstituteRepository instituteRepository, DepartmentRepository departmentRepository,
            CoreDepartmentRepository coreDepartmentRepository, ProgramRepository programRepository,
            UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder encoder) {
        this.instituteRepository = instituteRepository;
        this.departmentRepository = departmentRepository;
        this.coreDepartmentRepository = coreDepartmentRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsResponse> stats() {
        AdminStatsResponse res = new AdminStatsResponse(
                instituteRepository.count(),
                coreDepartmentRepository.count(),
                userRepository.count());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/create-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUsers(@RequestBody AdminCreateUsersRequest request) {
        List<AdminCreateUsersRequest.UserEntry> entries = request.getUsers();
        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: No users provided."));
        }
        for (AdminCreateUsersRequest.UserEntry entry : entries) {
            String email = entry.getEmail();
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email " + email + " is already in use!"));
            }
            String username = uniqueUsername(email.split("@")[0]);
            Users user = new Users(username, email, encoder.encode("Default@123"));
            ERole eRole = resolveRole(entry.getRole());
            Roles role = roleRepository.findByName(eRole)
                    .orElseThrow(() -> new RuntimeException("Error: Role not found."));
            List<Roles> roles = new ArrayList<>();
            roles.add(role);
            user.setRoles(roles);
            userRepository.save(user);
        }
        return ResponseEntity.ok(new MessageResponse("Users registered successfully!"));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> result = userRepository.findAll().stream()
                .map(u -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", u.getId());
                    row.put("username", u.getUsername());
                    row.put("email", u.getEmail());
                    row.put("roles", u.getRoles().stream()
                            .map(r -> r.getName().name())
                            .collect(Collectors.toList()));
                    return row;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private static final Logger bulkUploadLogger = LoggerFactory.getLogger(AdminStatsController.class);

    @PostMapping("/users/bulk-upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkUploadUsers(
            @RequestParam("instituteId") Long instituteId,
            @RequestParam("file") MultipartFile file) {
        try {
            return doBulkUploadUsers(instituteId, file);
        } catch (Exception ex) {
            bulkUploadLogger.error("Bulk upload failed", ex);
            return ResponseEntity.status(500).body(new MessageResponse(
                    "Bulk upload failed: " + ex.getClass().getSimpleName() + ": " + rootMessage(ex)));
        }
    }

    private ResponseEntity<?> doBulkUploadUsers(Long instituteId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: File is empty."));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Only .xlsx files are supported."));
        }

        Institute institute = instituteRepository.findById(instituteId).orElse(null);
        if (institute == null) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Institute not found with id " + instituteId));
        }

        List<Map<String, Object>> rowResults = new ArrayList<>();
        int created = 0;
        int skipped = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Workbook has no sheets."));
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Header row is missing."));
            }

            Map<String, Integer> columnIndex = readHeader(headerRow);
            Integer usernameCol = columnIndex.get("username");
            Integer emailCol = columnIndex.get("email");
            Integer roleCol = columnIndex.get("role");
            Integer departmentCol = columnIndex.get("department");
            Integer programCol = columnIndex.get("program");
            if (emailCol == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Header must include an 'email' column."));
            }

            DataFormatter formatter = new DataFormatter();
            int firstDataRow = headerRow.getRowNum() + 1;
            int lastRow = sheet.getLastRowNum();

            for (int r = firstDataRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row, formatter)) continue;

                Map<String, Object> rowResult = new LinkedHashMap<>();
                rowResult.put("row", r + 1);

                String email = readCell(row, emailCol, formatter);
                String username = usernameCol != null ? readCell(row, usernameCol, formatter) : "";
                String roleRaw = roleCol != null ? readCell(row, roleCol, formatter) : "";
                String departmentRaw = departmentCol != null ? readCell(row, departmentCol, formatter) : "";
                String programRaw = programCol != null ? readCell(row, programCol, formatter) : "";

                rowResult.put("email", email);
                rowResult.put("username", username);
                rowResult.put("department", departmentRaw);
                rowResult.put("program", programRaw);

                if (email == null || email.isBlank()) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Missing email");
                    rowResults.add(rowResult);
                    skipped++;
                    continue;
                }
                if (userRepository.existsByEmail(email)) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Email already in use");
                    rowResults.add(rowResult);
                    skipped++;
                    continue;
                }

                String baseUsername = (username == null || username.isBlank())
                        ? email.split("@")[0]
                        : username.trim();
                String finalUsername = uniqueUsername(baseUsername);

                ERole eRole = resolveRole(roleRaw);
                Roles roleEntity = roleRepository.findByName(eRole).orElse(null);
                if (roleEntity == null) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Role lookup failed: " + eRole.name());
                    rowResults.add(rowResult);
                    skipped++;
                    continue;
                }

                Department departmentEntity = null;
                if (departmentRaw != null && !departmentRaw.isBlank()) {
                    String deptKey = departmentRaw.trim();
                    departmentEntity = departmentRepository
                            .findByInstituteIdAndCodeIgnoreCase(institute.getId(), deptKey)
                            .or(() -> departmentRepository
                                    .findByInstituteIdAndNameIgnoreCase(institute.getId(), deptKey))
                            .orElse(null);
                    if (departmentEntity == null) {
                        rowResult.put("status", "skipped");
                        rowResult.put("reason", "Department '" + departmentRaw
                                + "' is not added to this institute (use a department code or name from the institute)");
                        rowResults.add(rowResult);
                        skipped++;
                        continue;
                    }
                }

                Programs programEntity = null;
                if (programRaw != null && !programRaw.isBlank()) {
                    if (departmentEntity == null) {
                        rowResult.put("status", "skipped");
                        rowResult.put("reason", "Program requires a department on the same row");
                        rowResults.add(rowResult);
                        skipped++;
                        continue;
                    }
                    String progKey = programRaw.trim();
                    Long deptId = departmentEntity.getId();
                    programEntity = programRepository
                            .findByDepartmentIdAndCodeIgnoreCase(deptId, progKey)
                            .or(() -> programRepository
                                    .findByDepartmentIdAndNameIgnoreCase(deptId, progKey))
                            .orElse(null);
                    if (programEntity == null) {
                        rowResult.put("status", "skipped");
                        rowResult.put("reason", "Program '" + programRaw + "' is not under department '"
                                + departmentEntity.getName() + "' (use a program code or name from this department)");
                        rowResults.add(rowResult);
                        skipped++;
                        continue;
                    }
                }

                Users user = new Users(finalUsername, email.trim(), encoder.encode("Default@123"));
                List<Roles> roles = new ArrayList<>();
                roles.add(roleEntity);
                user.setRoles(roles);
                user.setInstitute(institute);
                user.setDepartment(departmentEntity);
                user.setPrograms(programEntity);

                try {
                    userRepository.save(user);
                } catch (Exception ex) {
                    rowResult.put("username", finalUsername);
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Save failed: " + rootMessage(ex));
                    rowResults.add(rowResult);
                    skipped++;
                    continue;
                }

                rowResult.put("username", finalUsername);
                rowResult.put("role", eRole.name());
                rowResult.put("department", departmentEntity != null ? departmentEntity.getName() : null);
                rowResult.put("program", programEntity != null ? programEntity.getName() : null);
                rowResult.put("status", "created");
                rowResults.add(rowResult);
                created++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error reading workbook: " + e.getMessage()));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("instituteId", instituteId);
        body.put("instituteName", institute.getName());
        body.put("createdCount", created);
        body.put("skippedCount", skipped);
        body.put("rows", rowResults);
        return ResponseEntity.ok(body);
    }

    private static String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String msg = cur.getMessage();
        return msg != null ? msg : cur.getClass().getSimpleName();
    }

    private static final int MAX_USERNAME_LEN = 50;

    private String uniqueUsername(String base) {
        String trimmed = base == null ? "" : base.trim();
        if (trimmed.length() > MAX_USERNAME_LEN) {
            trimmed = trimmed.substring(0, MAX_USERNAME_LEN);
        }
        if (!userRepository.existsByUsername(trimmed)) {
            return trimmed;
        }
        for (int i = 1; i <= 9999; i++) {
            String suffix = String.valueOf(i);
            int keep = Math.min(trimmed.length(), MAX_USERNAME_LEN - suffix.length());
            String candidate = trimmed.substring(0, keep) + suffix;
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique username for: " + base);
    }

    private static ERole resolveRole(String raw) {
        if (raw == null) return ERole.ROLE_FACULTY;
        String normalized = raw.trim().toUpperCase().replace(' ', '_');
        if (normalized.isEmpty()) return ERole.ROLE_FACULTY;
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        try {
            return ERole.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return ERole.ROLE_FACULTY;
        }
    }

    private static Map<String, Integer> readHeader(Row headerRow) {
        Map<String, Integer> map = new LinkedHashMap<>();
        DataFormatter formatter = new DataFormatter();
        for (int c = headerRow.getFirstCellNum(); c < headerRow.getLastCellNum(); c++) {
            Cell cell = headerRow.getCell(c);
            if (cell == null) continue;
            String header = formatter.formatCellValue(cell).trim().toLowerCase();
            if (!header.isEmpty()) map.put(header, c);
        }
        return map;
    }

    private static String readCell(Row row, int col, DataFormatter formatter) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        if (cell.getCellType() == CellType.FORMULA) {
            try {
                return formatter.formatCellValue(cell).trim();
            } catch (Exception e) {
                return "";
            }
        }
        return formatter.formatCellValue(cell).trim();
    }

    private static boolean isRowEmpty(Row row, DataFormatter formatter) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell == null) continue;
            String v = formatter.formatCellValue(cell).trim();
            if (!v.isEmpty()) return false;
        }
        return true;
    }
}
