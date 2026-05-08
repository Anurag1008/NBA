import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

type DepartmentOption = { id: number; name: string; code?: string };
type ProgramOption = { id: number; name: string; code?: string };

export type AssignableUser = {
    id: number;
    username: string;
    email: string;
    departmentId: number | null;
    departmentName: string | null;
    programId: number | null;
    programName: string | null;
};

type Props = {
    user: AssignableUser | null;
    departments: DepartmentOption[];
    onClose: () => void;
    onSuccess: () => void;
};

export const AssignUserDialog = ({ user, departments, onClose, onSuccess }: Props) => {
    const axiosPrivate = useAxiosPrivate();
    const [departmentId, setDepartmentId] = useState<string>("");
    const [programId, setProgramId] = useState<string>("");
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const open = !!user;

    useEffect(() => {
        if (user) {
            setDepartmentId(user.departmentId ? String(user.departmentId) : "");
            setProgramId(user.programId ? String(user.programId) : "");
            setApiError(null);
            setSuccess(false);
        }
    }, [user]);

    useEffect(() => {
        if (!departmentId) {
            setPrograms([]);
            return;
        }
        let cancelled = false;
        setProgramsLoading(true);
        axiosPrivate
            .get<ProgramOption[]>(`/principal/departments/${departmentId}/programs`)
            .then((res) => {
                if (!cancelled) setPrograms(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => {
                if (!cancelled) setPrograms([]);
            })
            .finally(() => {
                if (!cancelled) setProgramsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [axiosPrivate, departmentId]);

    /* if dept changed and current program no longer belongs to it, clear */
    useEffect(() => {
        if (!programId) return;
        if (programs.length === 0) return;
        if (!programs.some((p) => String(p.id) === programId)) {
            setProgramId("");
        }
    }, [programs, programId]);

    const initialDept = user?.departmentId ? String(user.departmentId) : "";
    const initialProg = user?.programId ? String(user.programId) : "";
    const isUnchanged = departmentId === initialDept && programId === initialProg;

    const canSubmit = !!user && !isUnchanged && !submitting;

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!user) return;
        setApiError(null);
        setSubmitting(true);
        try {
            await axiosPrivate.put(`/principal/users/${user.id}/assignment`, {
                departmentId: departmentId ? Number(departmentId) : null,
                programId: programId ? Number(programId) : null,
            });
            setSuccess(true);
            setTimeout(onSuccess, 800);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? "Failed to update assignment. Please try again.";
            setApiError(typeof msg === "string" ? msg : "Failed to update assignment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { borderRadius: "0.75rem" } }}
        >
            <DialogTitle className="flex items-center justify-between pb-2">
                <span className="font-bold text-slate-900">Assign Department & Program</span>
                <IconButton size="small" onClick={handleClose} disabled={submitting}>
                    <MdClose size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers className="pt-4">
                {success ? (
                    <div className="py-6 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                            <span className="text-emerald-600 text-xl font-bold">✓</span>
                        </div>
                        <p className="font-semibold text-emerald-700">Assignment updated!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {user && (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                                    User
                                </p>
                                <p className="font-semibold text-slate-900">{user.username}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                                <p className="text-xs mt-1 text-slate-500">
                                    Currently:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {user.departmentName ?? "No department"}
                                    </span>
                                    {" / "}
                                    <span className="font-semibold text-slate-700">
                                        {user.programName ?? "No program"}
                                    </span>
                                </p>
                            </div>
                        )}

                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Department"
                            value={departmentId}
                            onChange={(e) => {
                                setDepartmentId(e.target.value);
                                setProgramId("");
                            }}
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        >
                            <MenuItem value="">
                                <em className="text-slate-400">No department</em>
                            </MenuItem>
                            {departments.map((d) => (
                                <MenuItem key={d.id} value={String(d.id)}>
                                    {d.name}
                                    {d.code ? ` (${d.code})` : ""}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Program"
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            disabled={submitting || !departmentId}
                            helperText={
                                !departmentId
                                    ? "Select a department first"
                                    : programsLoading
                                    ? "Loading…"
                                    : programs.length === 0
                                    ? "No programs in this department"
                                    : undefined
                            }
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        >
                            <MenuItem value="">
                                <em className="text-slate-400">No program</em>
                            </MenuItem>
                            {programs.map((p) => (
                                <MenuItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                    {p.code ? ` (${p.code})` : ""}
                                </MenuItem>
                            ))}
                        </TextField>

                        {apiError && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                                {apiError}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>

            {!success && (
                <DialogActions className="px-6 py-4 gap-2">
                    <Button
                        onClick={handleClose}
                        disabled={submitting}
                        sx={{ borderRadius: "0.5rem", textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        sx={{ borderRadius: "0.5rem", textTransform: "none", fontWeight: 600 }}
                    >
                        {submitting ? "Saving…" : "Save"}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default AssignUserDialog;
