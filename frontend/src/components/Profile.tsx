import { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Skeleton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import {
    MdAdd,
    MdBadge,
    MdCake,
    MdClose,
    MdDeleteOutline,
    MdEdit,
    MdEmail,
    MdEventAvailable,
    MdPerson,
    MdPhone,
    MdSchool,
    MdWorkOutline,
} from "react-icons/md";

const PROFILE_URL = "/users/me/details";
const QUALIFICATIONS_URL = "/users/me/qualifications";

type ProfileData = {
    username?: string;
    email?: string;
    firstName?: string | null;
    dateOfBirth?: string | null;
    dateOfJoining?: string | null;
    designation?: string | null;
    empCode?: string | null;
    phone?: string | null;
};

type Qualification = {
    id: number;
    degreeName: string;
    level?: string | null;
    yearOfCompletion: string;
    university: string;
};

type ProfileForm = {
    firstName: string;
    date_of_birth: string;
    date_of_joining: string;
    designation: string;
    emp_code: string;
    phone: string;
};

type QualificationForm = {
    degreeName: string;
    level: string;
    yearOfCompletion: string;
    university: string;
};

const LEVELS = ["UG", "PG", "PHD", "Diploma"];

const LEVEL_STYLES: Record<string, string> = {
    UG: "bg-sky-50 text-sky-700 border-sky-100",
    PG: "bg-violet-50 text-violet-700 border-violet-100",
    PHD: "bg-amber-50 text-amber-700 border-amber-100",
    Diploma: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const Profile = () => {
    const { auth } = useAuth();
    const axiosPrivate = useAxiosPrivate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [quals, setQuals] = useState<Qualification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [qualDialogOpen, setQualDialogOpen] = useState(false);
    const [editingQual, setEditingQual] = useState<Qualification | null>(null);

    const fetchAll = () => {
        setLoading(true);
        setError(null);
        Promise.all([
            axiosPrivate.get<ProfileData>(PROFILE_URL).then((r) => r.data),
            axiosPrivate.get<Qualification[]>(QUALIFICATIONS_URL).then((r) =>
                Array.isArray(r.data) ? r.data : []
            ),
        ])
            .then(([p, q]) => {
                setProfile(p ?? {});
                setQuals(q);
            })
            .catch(() => setError("Failed to load profile."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAll();
    }, [axiosPrivate]);

    const initial = useMemo(() => {
        const name = profile?.firstName || profile?.username || auth?.email || "U";
        return name.trim()[0]?.toUpperCase() ?? "U";
    }, [profile, auth]);

    const displayName = profile?.firstName || profile?.username || auth?.email || "User";
    const roles = auth?.roles?.map((r) => r.replace("ROLE_", "")).join(" · ") || "User";

    const hasDetails = !!(
        profile?.firstName ||
        profile?.designation ||
        profile?.empCode ||
        profile?.phone ||
        profile?.dateOfBirth ||
        profile?.dateOfJoining
    );

    const openAddQual = () => {
        setEditingQual(null);
        setQualDialogOpen(true);
    };

    const openEditQual = (q: Qualification) => {
        setEditingQual(q);
        setQualDialogOpen(true);
    };

    const handleDeleteQual = async (q: Qualification) => {
        if (!window.confirm(`Delete qualification "${q.degreeName}"?`)) return;
        try {
            await axiosPrivate.delete(`${QUALIFICATIONS_URL}/${q.id}`);
            fetchAll();
        } catch {
            setError("Failed to delete qualification.");
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* ── Hero Banner ─────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                </div>

                <div className="relative px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
                    <Avatar
                        sx={{
                            width: 96,
                            height: 96,
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "white",
                            fontSize: "2.25rem",
                            fontWeight: 700,
                            border: "3px solid rgba(255,255,255,0.4)",
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {initial}
                    </Avatar>

                    <div className="flex-1 text-white">
                        <Typography variant="h4" className="font-bold tracking-tight">
                            {displayName}
                        </Typography>
                        <Typography variant="body2" className="opacity-90 mt-1">
                            {profile?.designation || "Member"} · {roles}
                        </Typography>
                        <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
                            <MdEmail size={16} />
                            <span>{auth?.email}</span>
                        </div>
                    </div>

                    <Button
                        variant="contained"
                        startIcon={<MdEdit size={18} />}
                        onClick={() => setEditProfileOpen(true)}
                        disabled={loading}
                        sx={{
                            borderRadius: "0.75rem",
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "white",
                            color: "#4338ca",
                            boxShadow: "none",
                            "&:hover": { backgroundColor: "#f8fafc", boxShadow: "none" },
                        }}
                    >
                        {hasDetails ? "Edit Profile" : "Add Details"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* ── Personal Details ─────────────────────────────────── */}
            <SectionCard
                icon={<MdPerson size={20} className="text-indigo-600" />}
                title="Personal Details"
                accent="indigo"
                action={
                    !loading && !hasDetails ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                            Incomplete
                        </span>
                    ) : null
                }
            >
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={62} />
                        ))}
                    </div>
                ) : !hasDetails ? (
                    <EmptyState
                        message="Your personal details are empty."
                        hint="Click ‘Add Details’ above to get started."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoTile icon={<MdPerson />} label="First Name" value={profile?.firstName} />
                        <InfoTile icon={<MdWorkOutline />} label="Designation" value={profile?.designation} />
                        <InfoTile icon={<MdBadge />} label="Employee Code" value={profile?.empCode} />
                        <InfoTile icon={<MdPhone />} label="Phone" value={profile?.phone} />
                        <InfoTile icon={<MdCake />} label="Date of Birth" value={profile?.dateOfBirth} />
                        <InfoTile
                            icon={<MdEventAvailable />}
                            label="Date of Joining"
                            value={profile?.dateOfJoining}
                        />
                    </div>
                )}
            </SectionCard>

            {/* ── Qualifications ───────────────────────────────────── */}
            <SectionCard
                icon={<MdSchool size={20} className="text-emerald-600" />}
                title="Qualifications"
                accent="emerald"
                action={
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<MdAdd size={16} />}
                        onClick={openAddQual}
                        disabled={loading}
                        sx={{
                            borderRadius: "0.5rem",
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: "none",
                        }}
                    >
                        Add
                    </Button>
                }
            >
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={72} />
                        ))}
                    </div>
                ) : quals.length === 0 ? (
                    <EmptyState
                        message="No qualifications added yet."
                        hint="Click ‘Add’ to record your degrees."
                    />
                ) : (
                    <div className="space-y-2">
                        {quals.map((q) => (
                            <QualificationRow
                                key={q.id}
                                q={q}
                                onEdit={() => openEditQual(q)}
                                onDelete={() => handleDeleteQual(q)}
                            />
                        ))}
                    </div>
                )}
            </SectionCard>

            <EditProfileDialog
                open={editProfileOpen}
                initial={profile}
                onClose={() => setEditProfileOpen(false)}
                onSuccess={() => {
                    setEditProfileOpen(false);
                    fetchAll();
                }}
            />

            <QualificationDialog
                open={qualDialogOpen}
                initial={editingQual}
                onClose={() => setQualDialogOpen(false)}
                onSuccess={() => {
                    setQualDialogOpen(false);
                    fetchAll();
                }}
            />
        </div>
    );
};

/* ── Reusable bits ───────────────────────────────────────────────── */

const ACCENTS: Record<string, { ring: string; bg: string }> = {
    indigo: { ring: "ring-indigo-100", bg: "bg-indigo-50" },
    emerald: { ring: "ring-emerald-100", bg: "bg-emerald-50" },
};

const SectionCard = ({
    icon,
    title,
    accent,
    action,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    accent: keyof typeof ACCENTS;
    action?: React.ReactNode;
    children: React.ReactNode;
}) => {
    const a = ACCENTS[accent];
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.bg} ring-4 ${a.ring}`}>
                        {icon}
                    </div>
                    <Typography variant="h6" className="font-bold text-slate-900">
                        {title}
                    </Typography>
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
};

const InfoTile = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
}) => (
    <div className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
            <p
                className={`mt-0.5 font-medium truncate ${
                    value ? "text-slate-900" : "text-slate-400 italic font-normal"
                }`}
            >
                {value || "Not provided"}
            </p>
        </div>
    </div>
);

const EmptyState = ({ message, hint }: { message: string; hint?: string }) => (
    <div className="p-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-dashed border-slate-200 text-center">
        <Typography variant="body2" className="text-slate-700 font-medium">
            {message}
        </Typography>
        {hint && (
            <Typography variant="caption" className="text-slate-500 block mt-1">
                {hint}
            </Typography>
        )}
    </div>
);

const QualificationRow = ({
    q,
    onEdit,
    onDelete,
}: {
    q: Qualification;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const levelStyle = q.level ? LEVEL_STYLES[q.level] ?? "bg-slate-50 text-slate-700 border-slate-200" : null;
    const year = q.yearOfCompletion?.slice(0, 4);
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <MdSchool size={22} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Typography className="font-semibold text-slate-900 truncate">
                        {q.degreeName}
                    </Typography>
                    {q.level && levelStyle && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelStyle}`}>
                            {q.level}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                    {q.university}
                    {year && <span className="text-slate-400"> · Completed {year}</span>}
                </p>
            </div>
            <div className="flex items-center gap-1">
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={onEdit} sx={{ color: "text.secondary" }}>
                        <MdEdit size={18} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton
                        size="small"
                        onClick={onDelete}
                        sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                    >
                        <MdDeleteOutline size={18} />
                    </IconButton>
                </Tooltip>
            </div>
        </div>
    );
};

/* ── Edit Profile Dialog ─────────────────────────────────────────── */

const emptyProfileForm = (): ProfileForm => ({
    firstName: "",
    date_of_birth: "",
    date_of_joining: "",
    designation: "",
    emp_code: "",
    phone: "",
});

type EditProfileDialogProps = {
    open: boolean;
    initial: ProfileData | null;
    onClose: () => void;
    onSuccess: () => void;
};

const EditProfileDialog = ({ open, initial, onClose, onSuccess }: EditProfileDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [form, setForm] = useState<ProfileForm>(emptyProfileForm());
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                firstName: initial?.firstName ?? "",
                date_of_birth: initial?.dateOfBirth ?? "",
                date_of_joining: initial?.dateOfJoining ?? "",
                designation: initial?.designation ?? "",
                emp_code: initial?.empCode ?? "",
                phone: initial?.phone ?? "",
            });
            setApiError(null);
            setSuccess(false);
        }
    }, [open, initial]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const update = (field: keyof ProfileForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const canSubmit =
        form.firstName.trim().length > 0 &&
        form.date_of_birth.length > 0 &&
        form.date_of_joining.length > 0 &&
        form.designation.trim().length > 0 &&
        !submitting;

    const handleSubmit = async () => {
        setApiError(null);
        setSubmitting(true);
        try {
            await axiosPrivate.put(PROFILE_URL, {
                firstName: form.firstName.trim(),
                date_of_birth: form.date_of_birth,
                date_of_joining: form.date_of_joining,
                designation: form.designation.trim(),
                emp_code: form.emp_code.trim() || null,
                phone: form.phone.trim() || null,
            });
            setSuccess(true);
            setTimeout(onSuccess, 900);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to update profile.";
            setApiError(typeof msg === "string" ? msg : "Failed to update profile.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: "1rem" } }}
        >
            <DialogTitle className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <MdPerson size={18} />
                    </div>
                    <span className="font-bold text-slate-900">Edit Profile</span>
                </div>
                <IconButton size="small" onClick={handleClose} disabled={submitting}>
                    <MdClose size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers className="pt-4">
                {success ? (
                    <SuccessMark message="Profile saved successfully!" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField
                            label="First Name"
                            value={form.firstName}
                            onChange={(e) => update("firstName", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Designation"
                            value={form.designation}
                            onChange={(e) => update("designation", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Date of Birth"
                            type="date"
                            value={form.date_of_birth}
                            onChange={(e) => update("date_of_birth", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            InputLabelProps={{ shrink: true }}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Date of Joining"
                            type="date"
                            value={form.date_of_joining}
                            onChange={(e) => update("date_of_joining", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            InputLabelProps={{ shrink: true }}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Employee Code"
                            value={form.emp_code}
                            onChange={(e) => update("emp_code", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />

                        {apiError && (
                            <div className="sm:col-span-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
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

/* ── Qualification Dialog ────────────────────────────────────────── */

const emptyQualForm = (): QualificationForm => ({
    degreeName: "",
    level: "UG",
    yearOfCompletion: "",
    university: "",
});

type QualificationDialogProps = {
    open: boolean;
    initial: Qualification | null;
    onClose: () => void;
    onSuccess: () => void;
};

const QualificationDialog = ({ open, initial, onClose, onSuccess }: QualificationDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [form, setForm] = useState<QualificationForm>(emptyQualForm());
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                degreeName: initial?.degreeName ?? "",
                level: initial?.level ?? "UG",
                yearOfCompletion: initial?.yearOfCompletion ?? "",
                university: initial?.university ?? "",
            });
            setApiError(null);
            setSuccess(false);
        }
    }, [open, initial]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const update = (field: keyof QualificationForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const canSubmit =
        form.degreeName.trim().length > 0 &&
        form.university.trim().length > 0 &&
        form.yearOfCompletion.length > 0 &&
        !submitting;

    const handleSubmit = async () => {
        setApiError(null);
        setSubmitting(true);
        try {
            const payload = {
                degreeName: form.degreeName.trim(),
                level: form.level,
                yearOfCompletion: form.yearOfCompletion,
                university: form.university.trim(),
            };
            if (initial) {
                await axiosPrivate.put(`${QUALIFICATIONS_URL}/${initial.id}`, payload);
            } else {
                await axiosPrivate.post(QUALIFICATIONS_URL, payload);
            }
            setSuccess(true);
            setTimeout(onSuccess, 900);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to save qualification.";
            setApiError(typeof msg === "string" ? msg : "Failed to save qualification.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: "1rem" } }}
        >
            <DialogTitle className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <MdSchool size={18} />
                    </div>
                    <span className="font-bold text-slate-900">
                        {initial ? "Edit Qualification" : "Add Qualification"}
                    </span>
                </div>
                <IconButton size="small" onClick={handleClose} disabled={submitting}>
                    <MdClose size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers className="pt-4">
                {success ? (
                    <SuccessMark message="Qualification saved!" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField
                            label="Degree Name"
                            value={form.degreeName}
                            onChange={(e) => update("degreeName", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            placeholder="B.Tech in CSE"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            select
                            label="Level"
                            value={form.level}
                            onChange={(e) => update("level", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={submitting}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        >
                            {LEVELS.map((l) => (
                                <MenuItem key={l} value={l}>
                                    {l}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="University / Institution"
                            value={form.university}
                            onChange={(e) => update("university", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            className="sm:col-span-2"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        <TextField
                            label="Year of Completion"
                            type="date"
                            value={form.yearOfCompletion}
                            onChange={(e) => update("yearOfCompletion", e.target.value)}
                            required
                            fullWidth
                            size="small"
                            disabled={submitting}
                            InputLabelProps={{ shrink: true }}
                            className="sm:col-span-2"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />

                        {apiError && (
                            <div className="sm:col-span-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
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
                        {submitting ? "Saving…" : initial ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

const SuccessMark = ({ message }: { message: string }) => (
    <div className="py-6 text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
            <span className="text-white text-2xl font-bold">✓</span>
        </div>
        <p className="font-semibold text-emerald-700">{message}</p>
    </div>
);
