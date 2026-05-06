package com.portal.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.CoreProgram;
import com.portal.backend.entity.Department;
import com.portal.backend.entity.Institute;
import com.portal.backend.entity.NbaFile;
import com.portal.backend.entity.Programs;
import com.portal.backend.entity.Users;
import com.portal.backend.payload.request.CreateProgramRequest;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.CoreProgramRepository;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.repository.ProgramRepository;
import com.portal.backend.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/program")
public class ProgramController {

    @Autowired
    private InstituteRepository instituteRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private CoreProgramRepository coreProgramRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create-programs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProgram(@Valid @RequestBody CreateProgramRequest createProgram) {
        Long id = createProgram.getInstituteId();
        String dept_name = createProgram.getDepartmentName();
        Institute institute = instituteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institute not found with id " + id));
        List<Department> departments = departmentRepository.findByInstituteId(id)
                .orElseThrow(() -> new RuntimeException("department not found with id" + dept_name));
        Department department = null;
        for (Department dept : departments) {
            if (dept.getName().equals(dept_name)) {
                department = dept;
                break;
            }
        }

        if (department == null) {
            throw new RuntimeException("No department found with name " + dept_name + " in institute id " + id);
        }

        List<CreateProgramRequest.CreateProgram> programs = createProgram.getPrograms();

        if (department.getCode() == null || department.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse(
                    "Error: department '" + dept_name + "' has no code; cannot validate against core catalog"));
        }

        for (CreateProgramRequest.CreateProgram p : programs) {
            if (p.getCode() == null || p.getCode().isBlank()) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: program code is required for '" + p.getName() + "'"));
            }
            CoreProgram core = coreProgramRepository
                    .findByProgramCodeAndDepartmentCode(p.getCode(), department.getCode())
                    .orElse(null);
            if (core == null) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: program '" + p.getName() + "' (code " + p.getCode()
                                + ") is not in core catalog under department " + department.getCode()));
            }
            if (!core.getProgramName().equalsIgnoreCase(p.getName())) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: program name '" + p.getName() + "' does not match core catalog (expected '"
                                + core.getProgramName() + "' for code " + p.getCode() + ")"));
            }
            Programs program = new Programs();
            program.setInstitute(institute);
            program.setDepartment(department);
            program.setLevel(p.getLevel());
            program.setName(core.getProgramName());
            program.setCode(core.getProgramCode());
            programRepository.save(program);
        }
        return ResponseEntity.ok(new MessageResponse("Prgram created successfuly"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> programDetail(@PathVariable Long id) {
        Programs program = programRepository.findById(id).orElse(null);
        if (program == null) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Program not found with id " + id));
        }

        List<Users> assignedUsers = userRepository.findByProgramsId(id);
        List<Map<String, Object>> users = assignedUsers.stream()
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

        List<Map<String, Object>> files = program.getNbaFileList() == null
                ? List.of()
                : program.getNbaFileList().stream()
                        .map(f -> {
                            Map<String, Object> row = new LinkedHashMap<>();
                            row.put("id", f.getId());
                            row.put("code", f.getCode());
                            row.put("title", f.getTitle());
                            row.put("description", f.getDescription());
                            row.put("isActive", f.getIsActive());
                            row.put("fileLink", f.getFileLink());
                            return row;
                        })
                        .collect(Collectors.toList());

        NbaFile finalFile = (program.getNbaFileList() == null || program.getNbaFileList().isEmpty())
                ? null
                : program.getNbaFileList().get(program.getNbaFileList().size() - 1);

        Department department = program.getDepartment();
        Institute institute = program.getInstitute();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", program.getId());
        body.put("name", program.getName());
        body.put("code", program.getCode());
        body.put("level", program.getLevel());
        body.put("isActive", program.getIsActive());
        body.put("departmentId", department != null ? department.getId() : null);
        body.put("departmentName", department != null ? department.getName() : null);
        body.put("instituteId", institute != null ? institute.getId() : null);
        body.put("instituteName", institute != null ? institute.getName() : null);
        body.put("users", users);
        body.put("userCount", users.size());
        body.put("files", files);
        body.put("finalFileLink", finalFile != null ? finalFile.getFileLink() : null);
        body.put("finalFileTitle", finalFile != null ? finalFile.getTitle() : null);

        return ResponseEntity.ok(body);
    }
}
