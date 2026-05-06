import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    MenuItem,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from "@mui/material";

type InstituteForm = {
    name: string;
    code: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
};

type DepartmentRow = { code: string; name: string };
type ProgramRow = { name: string; code: string; level: string; isActive: boolean };
type CoreProgramOption = { programName: string; programCode: string };

const CREATE_INSTITUTE_URL = "/institute/create-institute";
const CREATE_DEPARTMENTS_URL = "/department/create-departments";
const CREATE_PROGRAMS_URL = "/program/create-programs";

const steps = ["Institute", "Departments", "Programs"];

const emptyInstitute: InstituteForm = {
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
};

export default function InstituteWizard() {
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    const [activeStep, setActiveStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [institute, setInstitute] = useState<InstituteForm>(emptyInstitute);
    const [instituteId, setInstituteId] = useState<number | null>(null);

    const [departments, setDepartments] = useState<DepartmentRow[]>([{ code: "", name: "" }]);
    const [savedDepartments, setSavedDepartments] = useState<DepartmentRow[]>([]);

    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [coreProgramOptions, setCoreProgramOptions] = useState<CoreProgramOption[]>([]);
    const [loadingCorePrograms, setLoadingCorePrograms] = useState(false);
    const [programs, setPrograms] = useState<ProgramRow[]>([]);
    const [currentProgram, setCurrentProgram] = useState<ProgramRow>({ name: "", code: "", level: "", isActive: true });

    const canContinueInstitute = useMemo(() => institute.name.trim().length > 0, [institute.name]);

    const canContinueDepartments = useMemo(
        () => !!instituteId && departments.length > 0 && departments.every((d) => d.code.trim() && d.name.trim()),
        [departments, instituteId]
    );

    const canContinuePrograms = useMemo(
        () => !!instituteId && !!selectedDepartment && programs.length > 0,
        [instituteId, selectedDepartment, programs.length]
    );

    const addDepartmentRow = () => setDepartments((prev) => [...prev, { code: "", name: "" }]);
    const removeDepartmentRow = (idx: number) => setDepartments((prev) => prev.filter((_, i) => i !== idx));

    const addProgram = () => {
        if (!currentProgram.name.trim() || !currentProgram.code.trim() || !currentProgram.level.trim()) return;
        setPrograms((prev) => [...prev, currentProgram]);
        setCurrentProgram({ name: "", code: "", level: "", isActive: true });
    };

    const selectedDeptCode = useMemo(
        () => savedDepartments.find((d) => d.name === selectedDepartment)?.code ?? "",
        [savedDepartments, selectedDepartment]
    );

    useEffect(() => {
        if (!selectedDeptCode) {
            setCoreProgramOptions([]);
            return;
        }
        let cancelled = false;
        setLoadingCorePrograms(true);
        axiosPrivate
            .get<CoreProgramOption[]>(`/core/departments/${encodeURIComponent(selectedDeptCode)}/programs`)
            .then((res) => {
                if (!cancelled) setCoreProgramOptions(res.data ?? []);
            })
            .catch(() => {
                if (!cancelled) setCoreProgramOptions([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingCorePrograms(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedDeptCode, axiosPrivate]);

    const back = () => setActiveStep((s) => Math.max(0, s - 1));

    const createInstitute = async () => {
        if (!canContinueInstitute) return;
        setBusy(true);
        setError(null);
        try {
            const res = await axiosPrivate.post<{ instituteId: number }>(CREATE_INSTITUTE_URL, institute);
            setInstituteId(res.data.instituteId);
            setActiveStep(1);
        } catch {
            setError("Failed to create institute. Please check name/code uniqueness and try again.");
        } finally {
            setBusy(false);
        }
    };

    const createDepartments = async () => {
        if (!canContinueDepartments || !instituteId) return;
        setBusy(true);
        setError(null);
        try {
            const res = await axiosPrivate.post<{ instituteId: number; departmentName: string[] }>(
                CREATE_DEPARTMENTS_URL,
                { instituteId, createDepartments: departments }
            );
            const canonicalNames = res.data.departmentName ?? [];
            const saved = departments.map((d, i) => ({
                code: d.code,
                name: canonicalNames[i] ?? d.name,
            }));
            setSavedDepartments(saved);
            setSelectedDepartment(saved[0]?.name ?? "");
            setActiveStep(2);
        } catch {
            setError("Failed to create departments. Please validate inputs and try again.");
        } finally {
            setBusy(false);
        }
    };

    const finishPrograms = async () => {
        if (!canContinuePrograms || !instituteId) return;
        setBusy(true);
        setError(null);
        try {
            await axiosPrivate.post(CREATE_PROGRAMS_URL, {
                instituteId,
                departmentName: selectedDepartment,
                programs,
            });
            navigate("/institute");
        } catch {
            setError("Failed to create programs. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="mb-8">
                <Typography variant="h4" className="font-bold text-slate-900 mb-2">
                    Create Institute
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-slate-600">
                    A guided setup: institute → departments → programs.
                </Typography>
            </div>

            <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-8">
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Divider className="my-6" />

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                            <Typography variant="body2" color="error">
                                ⚠️ {error}
                            </Typography>
                        </div>
                    )}

                    {/* Step 0: Institute Details */}
                    {activeStep === 0 && (
                        <Box className="space-y-5">
                            <TextField
                                label="Institute Name *"
                                value={institute.name}
                                onChange={(e) => setInstitute((p) => ({ ...p, name: e.target.value }))}
                                fullWidth
                                disabled={busy}
                                placeholder="e.g., Indian Institute of Technology"
                            />
                            <TextField
                                label="Institute Code"
                                value={institute.code}
                                onChange={(e) => setInstitute((p) => ({ ...p, code: e.target.value }))}
                                fullWidth
                                disabled={busy}
                                placeholder="e.g., IIT-B"
                            />

                            <Typography variant="subtitle2" className="font-semibold text-slate-700 pt-2">
                                Address Information
                            </Typography>

                            <TextField
                                label="Address Line 1"
                                value={institute.addressLine1}
                                onChange={(e) => setInstitute((p) => ({ ...p, addressLine1: e.target.value }))}
                                fullWidth
                                disabled={busy}
                            />
                            <TextField
                                label="Address Line 2"
                                value={institute.addressLine2}
                                onChange={(e) => setInstitute((p) => ({ ...p, addressLine2: e.target.value }))}
                                fullWidth
                                disabled={busy}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    label="City"
                                    value={institute.city}
                                    onChange={(e) => setInstitute((p) => ({ ...p, city: e.target.value }))}
                                    fullWidth
                                    disabled={busy}
                                />
                                <TextField
                                    label="State"
                                    value={institute.state}
                                    onChange={(e) => setInstitute((p) => ({ ...p, state: e.target.value }))}
                                    fullWidth
                                    disabled={busy}
                                />
                                <TextField
                                    label="Country"
                                    value={institute.country}
                                    onChange={(e) => setInstitute((p) => ({ ...p, country: e.target.value }))}
                                    fullWidth
                                    disabled={busy}
                                />
                                <TextField
                                    label="Pincode"
                                    value={institute.pincode}
                                    onChange={(e) => setInstitute((p) => ({ ...p, pincode: e.target.value }))}
                                    fullWidth
                                    disabled={busy}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button
                                    variant="outlined"
                                    onClick={() => { setInstitute(emptyInstitute); setError(null); }}
                                    disabled={busy}
                                >
                                    Clear
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={createInstitute}
                                    disabled={!canContinueInstitute || busy}
                                    sx={{ px: 4 }}
                                >
                                    {busy ? "Creating…" : "Continue"}
                                </Button>
                            </div>
                        </Box>
                    )}

                    {/* Step 1: Departments */}
                    {activeStep === 1 && (
                        <Box className="space-y-5">
                            <div>
                                <Typography variant="subtitle1" className="font-semibold text-slate-700">
                                    Add Departments
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Add one or more departments for this institute.
                                </Typography>
                            </div>

                            <div className="space-y-3">
                                {departments.map((d, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-3 items-end p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                                    >
                                        <TextField
                                            label="Code *"
                                            value={d.code}
                                            onChange={(e) =>
                                                setDepartments((prev) =>
                                                    prev.map((row, i) => (i === idx ? { ...row, code: e.target.value } : row))
                                                )
                                            }
                                            disabled={busy}
                                            size="small"
                                            className="w-32"
                                            placeholder="CS"
                                        />
                                        <TextField
                                            label="Name *"
                                            value={d.name}
                                            onChange={(e) =>
                                                setDepartments((prev) =>
                                                    prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row))
                                                )
                                            }
                                            fullWidth
                                            disabled={busy}
                                            size="small"
                                            placeholder="Computer Science"
                                        />
                                        <Button
                                            variant="text"
                                            color="error"
                                            onClick={() => removeDepartmentRow(idx)}
                                            disabled={departments.length === 1 || busy}
                                            sx={{ minWidth: "auto" }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button variant="outlined" onClick={addDepartmentRow} disabled={busy} fullWidth>
                                + Add Department
                            </Button>

                            <div className="flex items-center justify-between gap-3 pt-4">
                                <Button variant="outlined" onClick={back} disabled={busy}>
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={createDepartments}
                                    disabled={!canContinueDepartments || busy}
                                    sx={{ px: 4 }}
                                >
                                    {busy ? "Creating…" : "Continue"}
                                </Button>
                            </div>
                        </Box>
                    )}

                    {/* Step 2: Programs */}
                    {activeStep === 2 && (
                        <Box className="space-y-5">
                            <div>
                                <Typography variant="subtitle1" className="font-semibold text-slate-700">
                                    Add Programs
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Choose a department and add its programs.
                                </Typography>
                            </div>

                            <TextField
                                select
                                label="Department *"
                                value={selectedDepartment}
                                onChange={(e) => {
                                    setSelectedDepartment(e.target.value);
                                    setCurrentProgram({ name: "", code: "", level: "", isActive: true });
                                }}
                                fullWidth
                                disabled={busy}
                            >
                                {savedDepartments.map((d) => (
                                    <MenuItem key={d.code || d.name} value={d.name}>
                                        {d.code ? `${d.name} (${d.code})` : d.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 space-y-3">
                                <Typography variant="subtitle2" className="font-semibold text-slate-700">
                                    Add Program
                                </Typography>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Autocomplete
                                        options={coreProgramOptions}
                                        getOptionLabel={(opt) => `${opt.programName} (${opt.programCode})`}
                                        isOptionEqualToValue={(a, b) => a.programCode === b.programCode}
                                        value={
                                            currentProgram.code
                                                ? coreProgramOptions.find((o) => o.programCode === currentProgram.code) ?? null
                                                : null
                                        }
                                        onChange={(_, value) =>
                                            setCurrentProgram((p) => ({
                                                ...p,
                                                name: value?.programName ?? "",
                                                code: value?.programCode ?? "",
                                            }))
                                        }
                                        disabled={busy || !selectedDepartment || loadingCorePrograms}
                                        loading={loadingCorePrograms}
                                        noOptionsText={
                                            !selectedDepartment
                                                ? "Select a department first"
                                                : loadingCorePrograms
                                                ? "Loading…"
                                                : "No programs available for this department"
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Program *"
                                                placeholder="Select a program"
                                                size="small"
                                            />
                                        )}
                                    />
                                    <TextField
                                        label="Level (UG / PG / PhD) *"
                                        value={currentProgram.level}
                                        onChange={(e) => setCurrentProgram((p) => ({ ...p, level: e.target.value }))}
                                        fullWidth
                                        disabled={busy}
                                        size="small"
                                        placeholder="e.g., UG"
                                    />
                                </div>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={addProgram}
                                    disabled={busy || !currentProgram.name.trim() || !currentProgram.code.trim() || !currentProgram.level.trim()}
                                >
                                    Add Program
                                </Button>
                            </div>

                            {programs.length > 0 && (
                                <Card className="rounded-lg border-0 bg-slate-50">
                                    <CardContent className="p-4">
                                        <Typography variant="subtitle2" className="font-semibold mb-3">
                                            Added Programs ({programs.length})
                                        </Typography>
                                        <div className="space-y-2">
                                            {programs.map((p, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                                >
                                                    <div>
                                                        <Typography variant="body2" className="font-semibold">
                                                            {p.name} ({p.code})
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {p.level}
                                                        </Typography>
                                                    </div>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                            setPrograms((prev) => prev.filter((_, idx) => idx !== i))
                                                        }
                                                        disabled={busy}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex items-center justify-between gap-3 pt-4">
                                <Button variant="outlined" onClick={back} disabled={busy}>
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={finishPrograms}
                                    disabled={!canContinuePrograms || busy}
                                    sx={{ px: 4 }}
                                >
                                    {busy ? "Finishing…" : "Finish & Save"}
                                </Button>
                            </div>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
