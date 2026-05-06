package com.portal.backend.controller;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.portal.backend.entity.CoreDepartment;
import com.portal.backend.entity.CoreProgram;
import com.portal.backend.payload.response.MessageResponse;
import com.portal.backend.repository.CoreDepartmentRepository;
import com.portal.backend.repository.CoreProgramRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/core")
public class CoreCatalogController {

    private final CoreDepartmentRepository coreDepartmentRepository;
    private final CoreProgramRepository coreProgramRepository;

    public CoreCatalogController(CoreDepartmentRepository coreDepartmentRepository,
            CoreProgramRepository coreProgramRepository) {
        this.coreDepartmentRepository = coreDepartmentRepository;
        this.coreProgramRepository = coreProgramRepository;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<CoreDepartment>> listDepartments() {
        return ResponseEntity.ok(coreDepartmentRepository.findAll());
    }

    @GetMapping("/departments/{code}/programs")
    public ResponseEntity<?> listProgramsByDepartmentCode(@PathVariable String code) {
        if (!coreDepartmentRepository.existsByCode(code)) {
            return ResponseEntity.status(404)
                    .body(new MessageResponse("Core department not found with code " + code));
        }
        return ResponseEntity.ok(coreProgramRepository.findByDepartmentCode(code));
    }

    @GetMapping("/programs")
    public ResponseEntity<List<CoreProgram>> listPrograms(
            @RequestParam(value = "departmentCode", required = false) String departmentCode) {
        if (departmentCode != null && !departmentCode.isBlank()) {
            return ResponseEntity.ok(coreProgramRepository.findByDepartmentCode(departmentCode.trim()));
        }
        return ResponseEntity.ok(coreProgramRepository.findAll());
    }

    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCoreDepartments(@Valid @RequestBody List<CoreDepartment> entries) {
        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: No entries provided."));
        }
        for (CoreDepartment d : entries) {
            if (coreDepartmentRepository.existsByCode(d.getCode())) {
                continue;
            }
            d.setId(null);
            coreDepartmentRepository.save(d);
        }
        return ResponseEntity.ok(coreDepartmentRepository.findAll());
    }

    @PostMapping("/programs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCorePrograms(@Valid @RequestBody List<CoreProgram> entries) {
        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: No entries provided."));
        }
        for (CoreProgram p : entries) {
            if (!coreDepartmentRepository.existsByCode(p.getDepartmentCode())) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: department code '" + p.getDepartmentCode() + "' not in core_department"));
            }
            if (coreProgramRepository
                    .findByProgramCodeAndDepartmentCode(p.getProgramCode(), p.getDepartmentCode())
                    .isPresent()) {
                continue;
            }
            p.setId(null);
            coreProgramRepository.save(p);
        }
        return ResponseEntity.ok(coreProgramRepository.findAll());
    }

    @PostMapping("/departments/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadCoreDepartments(@RequestParam("file") MultipartFile file) {
        ResponseEntity<?> guard = validateXlsx(file);
        if (guard != null) return guard;

        List<Map<String, Object>> rows = new ArrayList<>();
        int created = 0;
        int alreadyPresent = 0;
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
            Map<String, Integer> idx = readHeader(headerRow);
            Integer nameCol = idx.get("name");
            Integer codeCol = idx.get("code");
            if (nameCol == null || codeCol == null) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: Header must include 'name' and 'code' columns."));
            }

            DataFormatter formatter = new DataFormatter();
            int firstDataRow = headerRow.getRowNum() + 1;
            int lastRow = sheet.getLastRowNum();

            for (int r = firstDataRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row, formatter)) continue;

                String name = readCell(row, nameCol, formatter);
                String code = readCell(row, codeCol, formatter);

                Map<String, Object> rowResult = new LinkedHashMap<>();
                rowResult.put("row", r + 1);
                rowResult.put("name", name);
                rowResult.put("code", code);

                if (name == null || name.isBlank() || code == null || code.isBlank()) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Missing name or code");
                    rows.add(rowResult);
                    skipped++;
                    continue;
                }

                if (coreDepartmentRepository.existsByCode(code)) {
                    rowResult.put("status", "alreadyPresent");
                    rows.add(rowResult);
                    alreadyPresent++;
                    continue;
                }

                CoreDepartment d = new CoreDepartment();
                d.setName(name);
                d.setCode(code);
                try {
                    coreDepartmentRepository.save(d);
                } catch (Exception ex) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Save failed: " + rootMessage(ex));
                    rows.add(rowResult);
                    skipped++;
                    continue;
                }
                rowResult.put("status", "created");
                rows.add(rowResult);
                created++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error reading workbook: " + e.getMessage()));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("createdCount", created);
        body.put("alreadyPresentCount", alreadyPresent);
        body.put("skippedCount", skipped);
        body.put("rows", rows);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/programs/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadCorePrograms(@RequestParam("file") MultipartFile file) {
        ResponseEntity<?> guard = validateXlsx(file);
        if (guard != null) return guard;

        List<Map<String, Object>> rows = new ArrayList<>();
        int created = 0;
        int alreadyPresent = 0;
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
            Map<String, Integer> idx = readHeader(headerRow);
            Integer programNameCol = firstNonNull(idx.get("program_name"), idx.get("program name"), idx.get("programname"));
            Integer programCodeCol = firstNonNull(idx.get("program_code"), idx.get("program code"), idx.get("programcode"));
            Integer deptNameCol = firstNonNull(idx.get("department_name"), idx.get("department name"), idx.get("departmentname"), idx.get("department"));
            Integer deptCodeCol = firstNonNull(idx.get("department_code"), idx.get("department code"), idx.get("departmentcode"));
            if (programNameCol == null || programCodeCol == null || deptNameCol == null || deptCodeCol == null) {
                return ResponseEntity.badRequest().body(new MessageResponse(
                        "Error: Header must include 'program_name', 'program_code', 'department_name', 'department_code'."));
            }

            DataFormatter formatter = new DataFormatter();
            int firstDataRow = headerRow.getRowNum() + 1;
            int lastRow = sheet.getLastRowNum();

            for (int r = firstDataRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row, formatter)) continue;

                String programName = readCell(row, programNameCol, formatter);
                String programCode = readCell(row, programCodeCol, formatter);
                String deptName = readCell(row, deptNameCol, formatter);
                String deptCode = readCell(row, deptCodeCol, formatter);

                Map<String, Object> rowResult = new LinkedHashMap<>();
                rowResult.put("row", r + 1);
                rowResult.put("programName", programName);
                rowResult.put("programCode", programCode);
                rowResult.put("departmentName", deptName);
                rowResult.put("departmentCode", deptCode);

                if (programName == null || programName.isBlank()
                        || programCode == null || programCode.isBlank()
                        || deptName == null || deptName.isBlank()
                        || deptCode == null || deptCode.isBlank()) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Missing one of program_name/program_code/department_name/department_code");
                    rows.add(rowResult);
                    skipped++;
                    continue;
                }

                if (!coreDepartmentRepository.existsByCode(deptCode)) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "department_code '" + deptCode + "' not in core_department");
                    rows.add(rowResult);
                    skipped++;
                    continue;
                }

                if (coreProgramRepository
                        .findByProgramCodeAndDepartmentCode(programCode, deptCode).isPresent()) {
                    rowResult.put("status", "alreadyPresent");
                    rows.add(rowResult);
                    alreadyPresent++;
                    continue;
                }

                CoreProgram p = new CoreProgram();
                p.setProgramName(programName);
                p.setProgramCode(programCode);
                p.setDepartmentName(deptName);
                p.setDepartmentCode(deptCode);
                try {
                    coreProgramRepository.save(p);
                } catch (Exception ex) {
                    rowResult.put("status", "skipped");
                    rowResult.put("reason", "Save failed: " + rootMessage(ex));
                    rows.add(rowResult);
                    skipped++;
                    continue;
                }
                rowResult.put("status", "created");
                rows.add(rowResult);
                created++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error reading workbook: " + e.getMessage()));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("createdCount", created);
        body.put("alreadyPresentCount", alreadyPresent);
        body.put("skippedCount", skipped);
        body.put("rows", rows);
        return ResponseEntity.ok(body);
    }

    private static ResponseEntity<?> validateXlsx(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: File is empty."));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Only .xlsx files are supported."));
        }
        return null;
    }

    private static Integer firstNonNull(Integer... values) {
        for (Integer v : values) if (v != null) return v;
        return null;
    }

    private static String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String msg = cur.getMessage();
        return msg != null ? msg : cur.getClass().getSimpleName();
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
