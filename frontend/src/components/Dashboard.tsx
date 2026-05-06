import { useEffect, useMemo, useRef, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import type { Institute } from "./types";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Card, CardContent, TextField, Typography, Skeleton } from "@mui/material";
import { MdSchool, MdApartment, MdPeople, MdAdd, MdArrowForward, MdAssignment, MdCheckCircle, MdHourglassEmpty, MdPending, MdUploadFile, MdErrorOutline, MdInfoOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const INSTITUTES_URL = "/institute/show-institute";
const ADMIN_STATS_URL = "/admin/stats";
const FACULTY_STATS_URL = "/faculty/my-stats";

type AdminStats = { institutes: number; departments: number; users: number };
type FacultyStats = { total: number; pending: number; completed: number; overdue: number };

type StatCardProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    isLoading?: boolean;
    onClick?: () => void;
};

const StatCard = ({ label, value, icon, color, isLoading = false, onClick }: StatCardProps) => {
    const interactive = !!onClick;
    return (
        <Card
            onClick={onClick}
            className={`rounded-xl shadow-sm border border-slate-100 bg-white transition-all duration-300 ${
                interactive
                    ? "hover:shadow-md hover:border-blue-200 cursor-pointer"
                    : "hover:shadow-md"
            }`}
        >
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <Typography variant="caption" className="font-semibold text-slate-500 uppercase tracking-wide text-xs">
                        {label}
                    </Typography>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                        {icon}
                    </div>
                </div>
                {isLoading ? (
                    <Skeleton width={80} height={44} />
                ) : (
                    <Typography variant="h4" className="font-bold text-slate-900">
                        {value.toLocaleString()}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

type CoreUploadResponse = {
    createdCount: number;
    alreadyPresentCount: number;
    skippedCount: number;
    rows: Array<Record<string, unknown>>;
};

type CoreUploadCardProps = {
    title: string;
    description: React.ReactNode;
    endpoint: string;
    accent: "blue" | "emerald";
    nameField: string;
};

const CoreUploadCard = ({ title, description, endpoint, accent, nameField }: CoreUploadCardProps) => {
    const axiosPrivate = useAxiosPrivate();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CoreUploadResponse | null>(null);

    const accentClasses = accent === "blue"
        ? { bg: "bg-blue-50", text: "text-blue-600", border: "hover:border-blue-400", btn: "bg-blue-600 hover:bg-blue-700" }
        : { bg: "bg-emerald-50", text: "text-emerald-600", border: "hover:border-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700" };

    const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reset = () => {
        setFile(null);
        setError(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await axiosPrivate.post<CoreUploadResponse>(endpoint, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
        } catch (e: unknown) {
            const message =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Upload failed. Please try again.";
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    const createdRows = result?.rows.filter((r) => r.status === "created") ?? [];
    const existingRows = result?.rows.filter((r) => r.status === "alreadyPresent") ?? [];
    const skippedRows = result?.rows.filter((r) => r.status === "skipped") ?? [];

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 ${accentClasses.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <MdUploadFile size={20} className={accentClasses.text} />
                </div>
                <div className="flex-1">
                    <Typography variant="subtitle1" className="font-bold text-slate-900">
                        {title}
                    </Typography>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <label className={`flex-1 flex items-center gap-2.5 px-3.5 py-2 border border-dashed border-slate-300 ${accentClasses.border} rounded-lg cursor-pointer transition-colors`}>
                    <MdUploadFile size={18} className="text-slate-400" />
                    <span className="text-xs text-slate-600 truncate">
                        {file ? file.name : "Click to choose an .xlsx file"}
                    </span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx"
                        onChange={onSelect}
                        className="hidden"
                    />
                </label>
                <button
                    onClick={upload}
                    disabled={!file || uploading}
                    className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 ${accentClasses.btn} disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm hover:shadow-md shrink-0`}
                >
                    {uploading ? "Uploading…" : "Upload"}
                </button>
                {(file || result || error) && (
                    <button
                        onClick={reset}
                        disabled={uploading}
                        className="text-xs text-slate-500 hover:text-slate-700 px-1.5"
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2">
                    <MdErrorOutline size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="mt-4 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                            <MdCheckCircle size={14} /> {result.createdCount} created
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                            <MdInfoOutline size={14} /> {result.alreadyPresentCount} already present
                        </span>
                        {result.skippedCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold">
                                <MdErrorOutline size={14} /> {result.skippedCount} skipped
                            </span>
                        )}
                    </div>

                    {createdRows.length > 0 && (
                        <details className="group" open>
                            <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
                                Created ({createdRows.length})
                            </summary>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {createdRows.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-mono">
                                        {String(r[nameField] ?? "")}
                                    </span>
                                ))}
                            </div>
                        </details>
                    )}

                    {existingRows.length > 0 && (
                        <details className="group">
                            <summary className="cursor-pointer text-xs font-semibold text-blue-700">
                                Already present ({existingRows.length})
                            </summary>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {existingRows.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-mono">
                                        {String(r[nameField] ?? "")}
                                    </span>
                                ))}
                            </div>
                        </details>
                    )}

                    {skippedRows.length > 0 && (
                        <details className="group">
                            <summary className="cursor-pointer text-xs font-semibold text-amber-700">
                                Skipped ({skippedRows.length})
                            </summary>
                            <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-800">
                                {skippedRows.map((r, i) => (
                                    <li key={i}>
                                        Row {String(r.row ?? "?")}: {String(r.reason ?? "skipped")}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export const Dashboard = () => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const isAdmin = auth?.roles?.includes("ROLE_ADMIN") ?? false;

    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [stats, setStats] = useState<AdminStats>({ institutes: 0, departments: 0, users: 0 });
    const [facultyStats, setFacultyStats] = useState<FacultyStats>({ total: 0, pending: 0, completed: 0, overdue: 0 });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const userName = auth?.email?.split("@")[0] ?? "there";

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const institutesRes = await axiosPrivate.get<Institute[]>(INSTITUTES_URL);
                if (cancelled) return;
                setInstitutes(Array.isArray(institutesRes.data) ? institutesRes.data : []);

                if (isAdmin) {
                    try {
                        const statsRes = await axiosPrivate.get<AdminStats>(ADMIN_STATS_URL);
                        if (!cancelled) setStats(statsRes.data);
                    } catch {
                        // silently ignore
                    }
                }

                try {
                    const fsRes = await axiosPrivate.get<FacultyStats>(FACULTY_STATS_URL);
                    if (!cancelled) setFacultyStats(fsRes.data);
                } catch {
                    // silently ignore
                }
            } catch (e) {
                if (!cancelled) {
                    console.error(e);
                    setError("Failed to load dashboard data.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [axiosPrivate, isAdmin]);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered =
            q.length === 0
                ? institutes
                : institutes.filter(
                      (i) =>
                          i.name?.toLowerCase().includes(q) ||
                          i.code?.toLowerCase().includes(q) ||
                          i.city?.toLowerCase().includes(q) ||
                          i.state?.toLowerCase().includes(q) ||
                          i.country?.toLowerCase().includes(q)
                  );
        return filtered.map((i) => ({
            id: i.id,
            name: i.name,
            code: i.code,
            city: i.city,
            state: i.state,
            country: i.country,
            departments: i.departmentList?.length ?? 0,
            active: i.isActive ? "Active" : "Inactive",
        }));
    }, [institutes, search]);

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "name", headerName: "Institute", flex: 1, minWidth: 200 },
            { field: "code", headerName: "Code", width: 130 },
            { field: "city", headerName: "City", width: 150 },
            { field: "state", headerName: "State", width: 150 },
            { field: "country", headerName: "Country", width: 140 },
            { field: "departments", headerName: "Depts", width: 100, type: "number" },
            {
                field: "active",
                headerName: "Status",
                width: 110,
                renderCell: (params) => (
                    <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            params.value === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                        }`}
                    >
                        {params.value}
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <div className="w-full space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md">
                <p className="text-blue-100 text-sm font-medium mb-1">{greeting},</p>
                <h1 className="text-2xl font-bold capitalize mb-1">{userName}</h1>
                <p className="text-blue-200 text-sm">
                    {isAdmin
                        ? "You have full admin access to the NBA portal."
                        : "Welcome to the NBA accreditation portal."}
                </p>
            </div>

            {/* File assignment stats — faculty only */}
            {!isAdmin && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                    label="Files Assigned"
                    value={facultyStats.total}
                    icon={<MdAssignment size={20} className="text-blue-600" />}
                    color="bg-blue-50"
                    isLoading={loading}
                />
                <StatCard
                    label="Pending"
                    value={facultyStats.pending}
                    icon={<MdPending size={20} className="text-amber-600" />}
                    color="bg-amber-50"
                    isLoading={loading}
                />
                <StatCard
                    label="Completed"
                    value={facultyStats.completed}
                    icon={<MdCheckCircle size={20} className="text-emerald-600" />}
                    color="bg-emerald-50"
                    isLoading={loading}
                />
                <StatCard
                    label="Overdue"
                    value={facultyStats.overdue}
                    icon={<MdHourglassEmpty size={20} className="text-red-500" />}
                    color="bg-red-50"
                    isLoading={loading}
                />
            </div>}

            {/* Stats — admin only */}
            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Institutes"
                        value={stats.institutes}
                        icon={<MdSchool size={20} className="text-blue-600" />}
                        color="bg-blue-50"
                        isLoading={loading}
                        onClick={() => navigate("/institute")}
                    />
                    <StatCard
                        label="Total Departments"
                        value={stats.departments}
                        icon={<MdApartment size={20} className="text-indigo-600" />}
                        color="bg-indigo-50"
                        isLoading={loading}
                    />
                    <StatCard
                        label="Total Users"
                        value={stats.users}
                        icon={<MdPeople size={20} className="text-violet-600" />}
                        color="bg-violet-50"
                        isLoading={loading}
                    />
                </div>
            )}

            {/* Quick actions — admin only */}
            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate("/create-institute")}
                        className="group flex items-center gap-4 bg-white border border-slate-100 hover:border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                    >
                        <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                            <MdAdd size={20} className="text-blue-600 group-hover:text-white transition-colors duration-200" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">Create Institute</p>
                            <p className="text-slate-500 text-xs mt-0.5">Add a new institution with departments & programs</p>
                        </div>
                        <MdArrowForward size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors duration-200" />
                    </button>

                    <button
                        onClick={() => navigate("/institute")}
                        className="group flex items-center gap-4 bg-white border border-slate-100 hover:border-emerald-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                    >
                        <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                            <MdSchool size={20} className="text-emerald-600 group-hover:text-white transition-colors duration-200" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">View Institutes</p>
                            <p className="text-slate-500 text-xs mt-0.5">Browse and manage all registered institutions</p>
                        </div>
                        <MdArrowForward size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors duration-200" />
                    </button>
                </div>
            )}

            {/* Core catalog uploads — admin only */}
            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CoreUploadCard
                        title="Upload Core Departments"
                        description={
                            <>
                                <span className="font-mono text-slate-700">.xlsx</span> with columns{" "}
                                <span className="font-mono text-slate-700">name</span>,{" "}
                                <span className="font-mono text-slate-700">code</span>. Existing
                                codes are kept; only new ones are added.
                            </>
                        }
                        endpoint="/core/departments/upload"
                        accent="blue"
                        nameField="name"
                    />
                    <CoreUploadCard
                        title="Upload Core Programs"
                        description={
                            <>
                                <span className="font-mono text-slate-700">.xlsx</span> with columns{" "}
                                <span className="font-mono text-slate-700">program_name</span>,{" "}
                                <span className="font-mono text-slate-700">program_code</span>,{" "}
                                <span className="font-mono text-slate-700">department_name</span>,{" "}
                                <span className="font-mono text-slate-700">department_code</span>.
                            </>
                        }
                        endpoint="/core/programs/upload"
                        accent="emerald"
                        nameField="programName"
                    />
                </div>
            )}

            {/* Institutes table */}
            <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                        <Typography variant="h6" className="font-bold text-slate-900 flex-1">
                            Institutes Directory
                        </Typography>
                        <TextField
                            size="small"
                            placeholder="Search institutes…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="sm:w-72"
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
                            onRowClick={(params) => isAdmin && navigate(`/institute/${params.id}`)}
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
                                "& .MuiDataGrid-row": isAdmin ? { cursor: "pointer" } : {},
                                "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(59,130,246,0.04)" },
                                "& .MuiDataGrid-cell": { borderColor: "rgba(15,23,42,0.05)" },
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
