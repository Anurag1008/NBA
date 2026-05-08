import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

export const PRINCIPAL_ASSIGNABLE_ROLES = [
    { value: "ROLE_FACULTY", label: "Faculty" },
    { value: "ROLE_HOD", label: "HOD" },
    { value: "ROLE_NBA_COORDINATOR", label: "NBA Coordinator" },
    { value: "ROLE_NBA_COORDINATOR_DEPT", label: "NBA Coordinator (Dept)" },
] as const;

export type PrincipalEditableUser = {
    id: number;
    username: string;
    email: string;
    roles: string[];
};

type Props = {
    user: PrincipalEditableUser | null;
    onClose: () => void;
    onSuccess: () => void;
};

export const EditUserRolesDialog = ({ user, onClose, onSuccess }: Props) => {
    const axiosPrivate = useAxiosPrivate();
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const open = !!user;
    const initialRoles = useMemo(
        () =>
            (user?.roles ?? []).filter((r) =>
                PRINCIPAL_ASSIGNABLE_ROLES.some((opt) => opt.value === r)
            ),
        [user]
    );

    useEffect(() => {
        if (user) {
            setSelected(initialRoles.length > 0 ? initialRoles : ["ROLE_FACULTY"]);
            setApiError(null);
            setSuccess(false);
        }
    }, [user, initialRoles]);

    const toggle = (role: string) => {
        setSelected((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const isUnchanged =
        selected.length === initialRoles.length &&
        selected.every((r) => initialRoles.includes(r));

    const canSubmit = !!user && selected.length > 0 && !isUnchanged && !submitting;

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!user) return;
        setApiError(null);
        setSubmitting(true);
        try {
            await axiosPrivate.put(`/principal/users/${user.id}/roles`, { roles: selected });
            setSuccess(true);
            setTimeout(onSuccess, 800);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? "Failed to update roles. Please try again.";
            setApiError(typeof msg === "string" ? msg : "Failed to update roles.");
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
                <span className="font-bold text-slate-900">Change Roles</span>
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
                        <p className="font-semibold text-emerald-700">Roles updated successfully!</p>
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
                                    Current roles:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {user.roles.length === 0
                                            ? "—"
                                            : user.roles
                                                  .map((r) => r.replace("ROLE_", ""))
                                                  .join(", ")}
                                    </span>
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Assignable roles
                            </p>
                            <div className="flex flex-col gap-1">
                                {PRINCIPAL_ASSIGNABLE_ROLES.map((opt) => (
                                    <FormControlLabel
                                        key={opt.value}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={selected.includes(opt.value)}
                                                onChange={() => toggle(opt.value)}
                                                disabled={submitting}
                                            />
                                        }
                                        label={
                                            <span className="text-sm text-slate-800">
                                                {opt.label}
                                            </span>
                                        }
                                    />
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">
                                Admin and Principal roles cannot be assigned by a principal.
                            </p>
                        </div>

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
                        {submitting ? "Updating…" : "Update Roles"}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default EditUserRolesDialog;
