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

export const ROLES = [
    { value: "ROLE_FACULTY", label: "Faculty" },
    { value: "ROLE_HOD", label: "HOD" },
    { value: "ROLE_PRINCIPAL", label: "Principal" },
    { value: "ROLE_NBA_COORDINATOR", label: "NBA Coordinator" },
    { value: "ROLE_NBA_COORDINATOR_DEPT", label: "NBA Coordinator (Dept)" },
    { value: "ROLE_ADMIN", label: "Admin" },
];

const userRoleUrl = (id: number) => `/admin/users/${id}/role`;

export type EditableUser = {
    id: number;
    username: string;
    email: string;
    roles: string[];
};

type EditRoleDialogProps = {
    user: EditableUser | null;
    onClose: () => void;
    onSuccess: () => void;
};

export const EditRoleDialog = ({ user, onClose, onSuccess }: EditRoleDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [role, setRole] = useState<string>("ROLE_FACULTY");
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const open = !!user;
    const currentRole = user?.roles?.[0] ?? "ROLE_FACULTY";

    useEffect(() => {
        if (user) {
            setRole(currentRole);
            setApiError(null);
            setSuccess(false);
        }
    }, [user, currentRole]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const canSubmit = !!user && role !== currentRole && !submitting;

    const handleSubmit = async () => {
        if (!user) return;
        setApiError(null);
        setSubmitting(true);
        try {
            await axiosPrivate.put(userRoleUrl(user.id), { role });
            setSuccess(true);
            setTimeout(onSuccess, 1000);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? "Failed to update role. Please try again.";
            setApiError(typeof msg === "string" ? msg : "Failed to update role.");
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
                <span className="font-bold text-slate-900">Change Role</span>
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
                        <p className="font-semibold text-emerald-700">Role updated successfully!</p>
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
                                    Current role:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {currentRole.replace("ROLE_", "")}
                                    </span>
                                </p>
                            </div>
                        )}

                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="New role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        >
                            {ROLES.map((r) => (
                                <MenuItem key={r.value} value={r.value}>
                                    {r.label}
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
                        {submitting ? "Updating…" : "Update Role"}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default EditRoleDialog;
