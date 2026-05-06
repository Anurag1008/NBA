import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

type CoreProgram = {
    id: number;
    programName: string;
    programCode: string;
    departmentName: string;
    departmentCode: string;
};

type AddProgramDialogProps = {
    open: boolean;
    onClose: () => void;
    instituteId: number;
    department: { name: string; code: string };
    onSuccess: () => void;
};

const PROGRAM_LEVELS = ["UG", "PG", "PhD", "Diploma"];

export const AddProgramDialog = ({
    open,
    onClose,
    instituteId,
    department,
    onSuccess,
}: AddProgramDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [catalog, setCatalog] = useState<CoreProgram[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedCode, setSelectedCode] = useState("");
    const [level, setLevel] = useState("UG");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !department.code) return;
        let cancelled = false;
        setError(null);
        setSelectedCode("");
        setLevel("UG");
        setLoading(true);
        axiosPrivate
            .get<CoreProgram[]>(
                `/core/departments/${encodeURIComponent(department.code)}/programs`
            )
            .then((res) => {
                if (!cancelled) setCatalog(res.data);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load program catalog.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, axiosPrivate, department.code]);

    const submit = async () => {
        const picked = catalog.find((c) => c.programCode === selectedCode);
        if (!picked) {
            setError("Pick a program first.");
            return;
        }
        if (!level.trim()) {
            setError("Level is required.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await axiosPrivate.post("/program/create-programs", {
                instituteId,
                departmentName: department.name,
                programs: [
                    {
                        name: picked.programName,
                        code: picked.programCode,
                        level: level.trim(),
                    },
                ],
            });
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const message =
                (e as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? "Failed to create program.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>
                Add Program
                <p className="text-xs font-normal text-slate-500 mt-1">
                    under {department.name}
                </p>
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth size="small" disabled={loading || submitting} sx={{ mt: 1 }}>
                    <InputLabel id="add-prog-label">Program</InputLabel>
                    <Select
                        labelId="add-prog-label"
                        label="Program"
                        value={selectedCode}
                        onChange={(e) => setSelectedCode(String(e.target.value))}
                    >
                        {catalog.length === 0 && !loading && (
                            <MenuItem value="" disabled>
                                No programs in core_program for {department.code}
                            </MenuItem>
                        )}
                        {catalog.map((c) => (
                            <MenuItem key={c.id} value={c.programCode}>
                                {c.programName}{" "}
                                <span className="ml-2 text-xs text-slate-400">
                                    {c.programCode}
                                </span>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mt: 2 }} disabled={submitting}>
                    <InputLabel id="add-prog-level-label">Level</InputLabel>
                    <Select
                        labelId="add-prog-level-label"
                        label="Level"
                        value={PROGRAM_LEVELS.includes(level) ? level : ""}
                        onChange={(e) => setLevel(String(e.target.value))}
                    >
                        {PROGRAM_LEVELS.map((lv) => (
                            <MenuItem key={lv} value={lv}>
                                {lv}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    fullWidth
                    size="small"
                    label="Custom level (optional)"
                    value={PROGRAM_LEVELS.includes(level) ? "" : level}
                    onChange={(e) => setLevel(e.target.value)}
                    sx={{ mt: 2 }}
                    helperText="Override if your level isn't in the list"
                    disabled={submitting}
                />
                {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={submit}
                    disabled={!selectedCode || submitting}
                >
                    {submitting ? "Adding…" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddProgramDialog;
