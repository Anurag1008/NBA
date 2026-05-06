import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import {
    MdArrowBack,
    MdSchool,
    MdLocationOn,
    MdDomain,
    MdPeople,
    MdLibraryBooks,
    MdUploadFile,
    MdCheckCircle,
    MdErrorOutline,
    MdAdd,
} from "react-icons/md";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import { AddProgramDialog } from "./AddProgramDialog";
import type {
    BulkUploadResponse,
    DepartmentSummary,
    InstituteDetail as InstituteDetailType,
} from "./types";

type CoreDepartment = { id: number; name: string; code: string };

export const InstituteDetail = () => {
    const { instituteId } = useParams<{ instituteId: string }>();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const isAdmin = auth?.roles?.includes("ROLE_ADMIN") ?? false;

    const [data, setData] = useState<InstituteDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axiosPrivate.get<InstituteDetailType>(
                `/institute/${instituteId}/detail`
            );
            setData(res.data);
        } catch {
            setError("Failed to load institute details.");
        } finally {
            setLoading(false);
        }
    }, [axiosPrivate, instituteId]);

    useEffect(() => {
        load();
    }, [load]);

    const [addDeptOpen, setAddDeptOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <CircularProgress />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-red-100 shadow-sm">
                <p className="text-red-600 font-medium mb-3">
                    {error ?? "Institute not found."}
                </p>
                <button
                    onClick={() => navigate("/institute")}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Back to institutes
                </button>
            </div>
        );
    }

    const location = [data.city, data.state, data.country].filter(Boolean).join(", ");

    return (
        <div className="w-full">
            {/* Back link */}
            <button
                onClick={() => navigate("/institute")}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
            >
                <MdArrowBack size={18} />
                Back to institutes
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <MdSchool size={28} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <Typography variant="h5" className="font-bold text-slate-900">
                                {data.name}
                            </Typography>
                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                    data.isActive
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-600 border-red-200"
                                }`}
                            >
                                {data.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {data.code && (
                            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide mb-2">
                                {data.code}
                            </p>
                        )}
                        {location && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <MdLocationOn size={16} className="text-slate-400" />
                                <span>{location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <StatTile
                        label="Departments"
                        value={data.departmentCount}
                        icon={<MdDomain className="text-indigo-600" size={20} />}
                        color="bg-indigo-50"
                    />
                    <StatTile
                        label="Programs"
                        value={data.programCount}
                        icon={<MdLibraryBooks className="text-violet-600" size={20} />}
                        color="bg-violet-50"
                    />
                    <StatTile
                        label="Users"
                        value={data.userCount}
                        icon={<MdPeople className="text-emerald-600" size={20} />}
                        color="bg-emerald-50"
                    />
                </div>
            </div>

            {/* Bulk-upload users via Excel */}
            <BulkUserUpload instituteId={data.id} />

            {/* Departments grid */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <Typography variant="h6" className="font-bold text-slate-900">
                    Departments
                </Typography>
                {isAdmin && (
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<MdAdd size={18} />}
                        onClick={() => setAddDeptOpen(true)}
                        sx={{ textTransform: "none", borderRadius: "0.5rem", boxShadow: "none" }}
                    >
                        Add Department
                    </Button>
                )}
            </div>

            {data.departments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdDomain size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No departments yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {data.departments.map((d) => (
                        <DepartmentCard
                            key={d.id}
                            department={d}
                            instituteId={data.id}
                            isAdmin={isAdmin}
                            onClick={() => navigate(`/department/${d.id}`)}
                            onProgramAdded={load}
                        />
                    ))}
                </div>
            )}

            <AddDepartmentDialog
                open={addDeptOpen}
                onClose={() => setAddDeptOpen(false)}
                instituteId={data.id}
                existingCodes={data.departments.map((d) => d.code).filter(Boolean)}
                onSuccess={load}
            />
        </div>
    );
};

const StatTile = ({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) => (
    <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3">
        <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
            {icon}
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
                {value.toLocaleString()}
            </p>
        </div>
    </div>
);

const DepartmentCard = ({
    department,
    instituteId,
    isAdmin,
    onClick,
    onProgramAdded,
}: {
    department: DepartmentSummary;
    instituteId: number;
    isAdmin: boolean;
    onClick: () => void;
    onProgramAdded: () => void;
}) => {
    const [addProgramOpen, setAddProgramOpen] = useState(false);

    return (
        <div
            onClick={onClick}
            className="group bg-white border border-slate-100 hover:border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
        >
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors duration-300">
                        <MdDomain
                            size={22}
                            className="text-indigo-600 group-hover:text-white transition-colors duration-300"
                        />
                    </div>
                    <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            department.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
                        }`}
                    >
                        {department.isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-0.5 leading-snug">
                    {department.name}
                </h3>
                {department.code && (
                    <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wide mb-4">
                        {department.code}
                    </p>
                )}

                <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <MdLibraryBooks size={15} className="text-slate-400" />
                            <span>
                                {department.programCount} program
                                {department.programCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MdPeople size={15} className="text-slate-400" />
                            <span>
                                {department.userCount} user
                                {department.userCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setAddProgramOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                        >
                            <MdAdd size={16} /> Program
                        </button>
                    )}
                </div>
            </div>

            <AddProgramDialog
                open={addProgramOpen}
                onClose={() => setAddProgramOpen(false)}
                instituteId={instituteId}
                department={department}
                onSuccess={onProgramAdded}
            />
        </div>
    );
};

const BulkUserUpload = ({ instituteId }: { instituteId: number }) => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkUploadResponse | null>(null);

    const reset = () => {
        setFile(null);
        setError(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setError(null);
        setResult(null);
        if (f && !f.name.toLowerCase().endsWith(".xlsx")) {
            setError("Please choose a .xlsx file.");
            setFile(null);
            return;
        }
        setFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // Use fetch instead of axiosPrivate to avoid the instance's
            // default 'application/json' Content-Type clobbering the browser-set
            // 'multipart/form-data; boundary=...' for the FormData body.
            const baseURL = axiosPrivate.defaults.baseURL ?? "";
            const fetchRes = await fetch(
                `${baseURL}/admin/users/bulk-upload?instituteId=${instituteId}`,
                {
                    method: "POST",
                    headers: auth?.accessToken
                        ? { Authorization: `Bearer ${auth.accessToken}` }
                        : {},
                    body: formData,
                    credentials: "include",
                }
            );
            const data: unknown = await fetchRes.json().catch(() => ({}));
            if (!fetchRes.ok) {
                const d = data as { message?: string; error?: string };
                throw {
                    response: { status: fetchRes.status, data: d },
                    message: d.message ?? d.error ?? `HTTP ${fetchRes.status}`,
                };
            }
            setResult(data as BulkUploadResponse);
        } catch (e: unknown) {
            console.error("Bulk upload failed:", e);
            const err = e as {
                message?: string;
                code?: string;
                response?: { status?: number; data?: unknown };
            };
            let display: string;
            if (err.response) {
                const status = err.response.status;
                const data = err.response.data;
                let body: string;
                if (typeof data === "string") {
                    body = data;
                } else if (data && typeof data === "object") {
                    const d = data as { message?: string; error?: string };
                    body = d.message ?? d.error ?? JSON.stringify(data);
                } else {
                    body = "(no body)";
                }
                display = `Upload failed (HTTP ${status}): ${body}`;
            } else {
                display = `Upload failed: ${err.message ?? "network or CORS error — check the browser console"}`;
            }
            setError(display);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <MdUploadFile size={22} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                    <Typography variant="h6" className="font-bold text-slate-900">
                        Bulk Add Users
                    </Typography>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Upload a <span className="font-mono text-slate-700">.xlsx</span> file with
                        columns <span className="font-mono text-slate-700">username</span>,{" "}
                        <span className="font-mono text-slate-700">email</span>, and optional{" "}
                        <span className="font-mono text-slate-700">role</span>. Missing roles
                        default to <span className="font-mono text-slate-700">ROLE_FACULTY</span>.
                        Users will be created under this institute.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="flex-1 flex items-center gap-3 px-4 py-2.5 border border-dashed border-slate-300 hover:border-emerald-400 rounded-lg cursor-pointer transition-colors">
                    <MdUploadFile size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-600 truncate">
                        {file ? file.name : "Click to choose an Excel file"}
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
                >
                    {uploading ? "Uploading…" : "Upload & Create Users"}
                </button>
                {(file || result || error) && (
                    <button
                        onClick={reset}
                        disabled={uploading}
                        className="text-sm text-slate-500 hover:text-slate-700 px-2"
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <MdErrorOutline size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {result && <UploadResultPanel result={result} />}
        </div>
    );
};

const UploadResultPanel = ({ result }: { result: BulkUploadResponse }) => (
    <div className="mt-5">
        <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
                <MdCheckCircle className="text-emerald-600" size={18} />
                <span className="font-semibold text-emerald-700">
                    {result.createdCount} created
                </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <MdErrorOutline className="text-amber-600" size={18} />
                <span className="font-semibold text-amber-700">
                    {result.skippedCount} skipped
                </span>
            </div>
        </div>

        <div className="border border-slate-100 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-1">Row</div>
                <div className="col-span-3">Username</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Note</div>
            </div>
            <div className="max-h-72 overflow-y-auto">
                {result.rows.map((row) => (
                    <div
                        key={row.row}
                        className="grid grid-cols-12 px-4 py-2 border-b border-slate-50 last:border-0 text-sm"
                    >
                        <div className="col-span-1 text-slate-500">{row.row}</div>
                        <div className="col-span-3 text-slate-700 truncate">{row.username}</div>
                        <div className="col-span-4 text-slate-600 truncate">{row.email}</div>
                        <div className="col-span-2">
                            <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    row.status === "created"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                }`}
                            >
                                {row.status}
                            </span>
                        </div>
                        <div className="col-span-2 text-slate-500 text-xs truncate">
                            {row.status === "created" ? row.role ?? "" : row.reason ?? ""}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

type AddDepartmentDialogProps = {
    open: boolean;
    onClose: () => void;
    instituteId: number;
    existingCodes: string[];
    onSuccess: () => void;
};

const AddDepartmentDialog = ({
    open,
    onClose,
    instituteId,
    existingCodes,
    onSuccess,
}: AddDepartmentDialogProps) => {
    const axiosPrivate = useAxiosPrivate();
    const [catalog, setCatalog] = useState<CoreDepartment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedCode, setSelectedCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setError(null);
        setSelectedCode("");
        setLoading(true);
        axiosPrivate
            .get<CoreDepartment[]>("/core/departments")
            .then((res) => {
                if (!cancelled) setCatalog(res.data);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load department catalog.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, axiosPrivate]);

    const taken = new Set(existingCodes.map((c) => c.toUpperCase()));
    const available = catalog.filter((c) => !taken.has(c.code.toUpperCase()));

    const submit = async () => {
        const picked = catalog.find((c) => c.code === selectedCode);
        if (!picked) {
            setError("Pick a department first.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await axiosPrivate.post("/department/create-departments", {
                instituteId,
                createDepartments: [{ name: picked.name, code: picked.code }],
            });
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const message =
                (e as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? "Failed to create department.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Add Department</DialogTitle>
            <DialogContent>
                <p className="text-xs text-slate-500 mb-3">
                    Pick a department from the master catalog. Only departments not yet
                    added to this institute are listed.
                </p>
                <FormControl fullWidth size="small" disabled={loading || submitting}>
                    <InputLabel id="add-dept-label">Department</InputLabel>
                    <Select
                        labelId="add-dept-label"
                        label="Department"
                        value={selectedCode}
                        onChange={(e) => setSelectedCode(String(e.target.value))}
                    >
                        {available.length === 0 && !loading && (
                            <MenuItem value="" disabled>
                                {catalog.length === 0
                                    ? "Catalog is empty — upload core_department first"
                                    : "All catalog departments already added"}
                            </MenuItem>
                        )}
                        {available.map((c) => (
                            <MenuItem key={c.id} value={c.code}>
                                {c.name}{" "}
                                <span className="ml-2 text-xs text-slate-400">{c.code}</span>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {error && (
                    <p className="mt-3 text-xs text-red-600">{error}</p>
                )}
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

export default InstituteDetail;
