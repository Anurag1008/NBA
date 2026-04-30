package com.portal.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portal.backend.entity.Department;
import com.portal.backend.entity.Institute;
import com.portal.backend.entity.Programs;
import com.portal.backend.payload.request.CreateProgramRequest;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.DepartmentRepository;
import com.portal.backend.repository.InstituteRepository;
import com.portal.backend.repository.ProgramRepository;

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

    @PostMapping("/create-programs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProgram(@Valid @RequestBody CreateProgramRequest createProgram) {
        // we have departmentname and institute id for creating program
        // Authentication auth = SecurityContextHolder.getContext().getAuthentication();
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

        for (CreateProgramRequest.CreateProgram dept : programs) {
            Programs program = new Programs();
            program.setInstitute(institute);
            program.setDepartment(department);
            program.setLevel(dept.getLevel());
            program.setName(dept.getName());
            programRepository.save(program);

        }
        return ResponseEntity.ok(new MessageResponse("Prgram created successfuly"));
    }
}
