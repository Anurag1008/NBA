import { useEffect, useMemo, useRef, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import {
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
    Skeleton,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdPeople } from "react-icons/md";
import { EditRoleDialog, ROLES } from "./EditRoleDialog";

type UserRow = { id: number; username: string; email: string; roles: string[] };

const USERS_URL = "/admin/users";
const CREATE_USERS_URL = "/admin/create-users";

export const Users = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const currentEmail = auth?.email?.toLowerCase() ?? "";
    const [users, setUsers] = useState<UserRow[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        setError(null);
        axiosPrivate
            .get<UserRow[]>(USERS_URL)
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError("Failed to load users."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, [axiosPrivate]);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered =
            q.length === 0
                ? users
                : users.filter(
                      (u) =>
                          u.username?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.roles?.some((r) => r.toLowerCase().includes(q))
                  );
        return filtered.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            roles: u.roles.map((r) => r.replace("ROLE_", "")).join(", "),
            _raw: u,
        }));
    }, [users, search]);

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "id", headerName: "ID", width: 80, type: "number" },
            { field: "username", headerName: "Username", flex: 1, minWidth: 160 },
            { field: "email", headerName: "Email", flex: 2, minWidth: 200 },
            {
                field: "roles",
                headerName: "Role(s)",
                flex: 1,
                minWidth: 160,
                renderCell: (params) => (
                    <div className="flex gap-1 flex-wrap items-center h-full">
                        {params.value
                            .split(", ")
                            .filter(Boolean)
                            .map((role: string, i: number) => (
                                <span
                                    key={i}
                                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                                >
                                    {role}
                                </span>
                            ))}
                    </div>
                ),
            },
            {
                field: "actions",
                headerName: "Actions",
                width: 120,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params) => {
                    const row = params.row as UserRow & { _raw: UserRow };
                    const isSelf =
                        !!currentEmail && row.email?.toLowerCase() === currentEmail;
                    return (
                        <Tooltip
                            title={
                                isSelf
                                    ? "You cannot change your own role"
                                    : "Change role"
                            }
                        >
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<MdEdit size={16} />}
                                    disabled={isSelf}
                                    onClick={() => setEditingUser(row._raw)}
                                    sx={{
                                        borderRadius: "0.5rem",
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Role
                                </Button>
                            </span>
                        </Tooltip>
                    );
                },
            },
        ],
        [currentEmail]
    );

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                        <MdPeople size={22} className="text-violet-600" />
                    </div>
                    <div>
                        <Typography variant="h5" className="font-bold text-slate-900">
                            Users
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {loading ? (
                                <Skeleton width={120} />
                            ) : (
                                `${users.length} registered user${users.length !== 1 ? "s" : ""}`
                            )}
                        </Typography>
                    </div>
                </div>
                <Button
                    variant="contained"
                    startIcon={<MdAdd size={18} />}
                    onClick={() => setDialogOpen(true)}
                    sx={{ borderRadius: "0.5rem", textTransform: "none", fontWeight: 600 }}
                >
                    Create Users
                </Button>
            </div>

            {/* Table */}
            <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                        <Typography variant="h6" className="font-bold text-slate-900 flex-1">
                            All Users
                        </Typography>
                        <TextField
                            size="small"
                            placeholder="Search by name, email or role…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="sm:w-80"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div style={{ height: 520 }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            loading={loading}
                            disableRowSelectionOnClick
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            sx={{
                                border: 0,
                                "& .MuiDataGrid-columnHeaders": {
                                    backgroundColor: "rgba(15,23,42,0.04)",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                },
                                "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(59,130,246,0.04)" },
                                "& .MuiDataGrid-cell": { borderColor: "rgba(15,23,42,0.05)" },
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <CreateUsersDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={() => {
                    setDialogOpen(false);
                    fetchUsers();
                }}
            />

            <EditRoleDialog
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={() => {
                    setEditingUser(null);
                    fetchUsers();
                }}
            />
        </div>
    );
};

/* ── Create Users Dialog ─────────────────────────────────────────── */

type UserEntry = { email: string; role: string };

type CreateUsersDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const emptyEntry = (): UserEntry => ({ email: "", role: "ROLE_FACULTY" });

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const CreateUsersDialog = ({ open, onClose, onSuccess }: CreateUsersDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [entries, setEntries] = useState<UserEntry[]>([emptyEntry()]);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const lastInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        if (submitting) return;
        setEntries([emptyEntry()]);
        setApiError(null);
        setSuccess(false);
        onClose();
    };

    const addRow = () => {
        setEntries((prev) => [...prev, emptyEntry()]);
        setTimeout(() => lastInputRef.current?.focus(), 50);
    };

    const removeRow = (idx: number) =>
        setEntries((prev) => prev.length === 1 ? [emptyEntry()] : prev.filter((_, i) => i !== idx));

    const updateEntry = (idx: number, field: keyof UserEntry, value: string) =>
        setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

    const validEntries = entries.filter((e) => e.email.trim() && isValidEmail(e.email));
    const hasInvalidEmail = entries.some((e) => e.email.trim() && !isValidEmail(e.email));
    const canSubmit = validEntries.length > 0 && !hasInvalidEmail && !submitting;

    const handleSubmit = async () => {
        setApiError(null);
        setSubmitting(true);
        try {
            await axiosPrivate.post(CREATE_USERS_URL, {
                users: validEntries.map((e) => ({ email: e.email.trim(), role: e.role })),
            });
            setSuccess(true);
            setTimeout(onSuccess, 1200);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to create users. Please try again.";
            setApiError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "0.75rem" } }}>
            <DialogTitle className="flex items-center justify-between pb-2">
                <span className="font-bold text-slate-900">Create Users</span>
                <IconButton size="small" onClick={handleClose} disabled={submitting}>
                    <MdClose size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers className="pt-4">
                <p className="text-sm text-slate-500 mb-4">
                    Enter email addresses and assign a role to each user. Default password will be{" "}
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Default@123</span>.
                </p>

                {success ? (
                    <div className="py-6 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                            <span className="text-emerald-600 text-xl font-bold">✓</span>
                        </div>
                        <p className="font-semibold text-emerald-700">Users created successfully!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_160px_36px] gap-2 px-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</span>
                            <span />
                        </div>

                        {entries.map((entry, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_160px_36px] gap-2 items-start">
                                <TextField
                                    inputRef={idx === entries.length - 1 ? lastInputRef : undefined}
                                    fullWidth
                                    size="small"
                                    type="email"
                                    placeholder={`user@institution.ac.in`}
                                    value={entry.email}
                                    onChange={(e) => updateEntry(idx, "email", e.target.value)}
                                    error={!!entry.email.trim() && !isValidEmail(entry.email)}
                                    helperText={
                                        entry.email.trim() && !isValidEmail(entry.email)
                                            ? "Invalid email"
                                            : undefined
                                    }
                                    disabled={submitting}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); addRow(); }
                                    }}
                                />
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={entry.role}
                                    onChange={(e) => updateEntry(idx, "role", e.target.value)}
                                    disabled={submitting}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                                >
                                    {ROLES.map((r) => (
                                        <MenuItem key={r.value} value={r.value}>
                                            {r.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <IconButton
                                    size="small"
                                    onClick={() => removeRow(idx)}
                                    disabled={submitting}
                                    sx={{ mt: "2px", color: "text.disabled", "&:hover": { color: "error.main" } }}
                                >
                                    <MdDeleteOutline size={18} />
                                </IconButton>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addRow}
                            disabled={submitting}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 disabled:opacity-50"
                        >
                            <MdAdd size={16} /> Add another user
                        </button>

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
                        {submitting
                            ? "Creating…"
                            : `Create ${validEntries.length > 0 ? validEntries.length : ""} User${validEntries.length !== 1 ? "s" : ""}`}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};


export default Users;
