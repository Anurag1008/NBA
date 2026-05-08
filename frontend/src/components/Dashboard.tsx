import { useEffect, useMemo, useRef, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAuth";
import type { Institute } from "./types";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Card, CardContent, TextField, Typography, Skeleton, Button } from "@mui/material";
import { MdSchool, MdApartment, MdPeople, MdAdd, MdArrowForward, MdAssignment, MdCheckCircle, MdHourglassEmpty, MdPending, MdUploadFile, MdErrorOutline, MdInfoOutline, MdCalendarToday, MdTrendingUp, MdGroupAdd } from "react-icons/md";
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

type AdminStatCardProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    iconColor: string;
    subtitle?: string;
    isLoading?: boolean;
    onClick?: () => void;
};

const AdminStatCard = ({
    label,
    value,
    icon,
    gradient,
    iconBg,
    iconColor,
    subtitle,
    isLoading = false,
    onClick,
}: AdminStatCardProps) => {
    const interactive = !!onClick;
    return (
        <button
            onClick={onClick}
            disabled={!interactive}
            className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-5 text-left transition-all duration-300 ${
                interactive
                    ? "hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-200 cursor-pointer"
                    : "cursor-default"
            }`}
        >
            {/* Decorative gradient blob */}
            <div
                className={`pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-40 blur-2xl ${gradient}`}
            />

            <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <Typography
                        variant="caption"
                        className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]"
                    >
                        {label}
                    </Typography>
                    {isLoading ? (
                        <Skeleton width={100} height={48} className="mt-2" />
                    ) : (
                        <Typography
                            variant="h3"
                            className="font-bold text-slate-900 mt-1 leading-tight"
                            sx={{ fontSize: "2.25rem" }}
                        >
                            {value.toLocaleString()}
                        </Typography>
                    )}
                    {subtitle && !isLoading && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                            <MdTrendingUp size={14} className="text-emerald-500" />
                            <span>{subtitle}</span>
                        </div>
                    )}
                </div>
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300`}
                >
                    {icon}
                </div>
            </div>

            {interactive && (
                <div className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-slate-700 transition-colors">
                    <span>View all</span>
                    <MdArrowForward
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                </div>
            )}
        </button>
    );
};

type QuickActionAccent = "blue" | "emerald" | "violet";

const QUICK_ACTION_STYLES: Record<
    QuickActionAccent,
    { hoverBorder: string; iconBg: string; iconText: string; arrow: string; bgGlow: string }
> = {
    blue: {
        hoverBorder: "hover:border-blue-200",
        iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
        iconText: "text-white",
        arrow: "group-hover:text-blue-500",
        bgGlow: "bg-blue-200",
    },
    emerald: {
        hoverBorder: "hover:border-emerald-200",
        iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        iconText: "text-white",
        arrow: "group-hover:text-emerald-500",
        bgGlow: "bg-emerald-200",
    },
    violet: {
        hoverBorder: "hover:border-violet-200",
        iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
        iconText: "text-white",
        arrow: "group-hover:text-violet-500",
        bgGlow: "bg-violet-200",
    },
};

type QuickActionCardProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: QuickActionAccent;
    onClick: () => void;
};

const QuickActionCard = ({ title, description, icon, accent, onClick }: QuickActionCardProps) => {
    const s = QUICK_ACTION_STYLES[accent];
    return (
        <button
            onClick={onClick}
            className={`group relative overflow-hidden text-left flex items-center gap-4 bg-white border border-slate-100 ${s.hoverBorder} rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
        >
            <div
                className={`pointer-events-none absolute -bottom-12 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-30 blur-2xl transition-opacity ${s.bgGlow}`}
            />
            <div
                className={`relative w-12 h-12 ${s.iconBg} ${s.iconText} rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300`}
            >
                {icon}
            </div>
            <div className="relative flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{description}</p>
            </div>
            <MdArrowForward
                size={18}
                className={`relative text-slate-300 ${s.arrow} transition-all duration-200 group-hover:translate-x-1`}
            />
        </button>
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

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const userName = auth?.email?.split("@")[0] ?? "there";
    const todayLabel = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                if (isAdmin) {
                    try {
                        const institutesRes = await axiosPrivate.get<Institute[]>(INSTITUTES_URL);
                        if (!cancelled) {
                            setInstitutes(Array.isArray(institutesRes.data) ? institutesRes.data : []);
                        }
                    } catch {
                        if (!cancelled) setInstitutes([]);
                    }

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
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
                {/* decorative blobs */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                    <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 left-20 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl" />
                </div>
                {/* subtle dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                />

                <div className="relative px-6 sm:px-10 py-8 flex flex-col md:flex-row md:items-center gap-6 text-white">
                    <div className="flex-1 min-w-0">
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                Admin
                            </span>
                        )}
                        <p className="text-blue-100 text-sm font-medium">{greeting},</p>
                        <h1 className="text-3xl sm:text-4xl font-bold capitalize tracking-tight mt-0.5">
                            {userName}
                        </h1>
                        <p className="text-blue-100/90 text-sm mt-2 max-w-xl">
                            {isAdmin
                                ? "Manage institutes, departments, programs, and users from a single command center."
                                : "Welcome to the NBA accreditation portal."}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-blue-100/80">
                            <MdCalendarToday size={14} />
                            <span>{todayLabel}</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
                            <Button
                                variant="contained"
                                startIcon={<MdAdd size={18} />}
                                onClick={() => navigate("/create-institute")}
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
                                New Institute
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<MdGroupAdd size={18} />}
                                onClick={() => navigate("/users")}
                                sx={{
                                    borderRadius: "0.75rem",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    color: "white",
                                    borderColor: "rgba(255,255,255,0.5)",
                                    "&:hover": {
                                        borderColor: "white",
                                        backgroundColor: "rgba(255,255,255,0.1)",
                                    },
                                }}
                            >
                                Manage Users
                            </Button>
                        </div>
                    )}
                </div>
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
                    <AdminStatCard
                        label="Total Institutes"
                        value={stats.institutes}
                        icon={<MdSchool size={22} />}
                        gradient="bg-blue-300"
                        iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
                        iconColor="text-white"
                        subtitle="Active institutions"
                        isLoading={loading}
                        onClick={() => navigate("/institute")}
                    />
                    <AdminStatCard
                        label="Total Departments"
                        value={stats.departments}
                        icon={<MdApartment size={22} />}
                        gradient="bg-indigo-300"
                        iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
                        iconColor="text-white"
                        subtitle="Across all institutes"
                        isLoading={loading}
                    />
                    <AdminStatCard
                        label="Total Users"
                        value={stats.users}
                        icon={<MdPeople size={22} />}
                        gradient="bg-violet-300"
                        iconBg="bg-gradient-to-br from-violet-500 to-violet-600"
                        iconColor="text-white"
                        subtitle="Registered members"
                        isLoading={loading}
                        onClick={() => navigate("/users")}
                    />
                </div>
            )}

            {/* Quick actions — admin only */}
            {isAdmin && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Typography variant="overline" className="font-bold text-slate-500 tracking-wider">
                            Quick Actions
                        </Typography>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <QuickActionCard
                            title="Create Institute"
                            description="Add a new institution with departments & programs"
                            icon={<MdAdd size={22} />}
                            accent="blue"
                            onClick={() => navigate("/create-institute")}
                        />
                        <QuickActionCard
                            title="View Institutes"
                            description="Browse and manage all registered institutions"
                            icon={<MdSchool size={22} />}
                            accent="emerald"
                            onClick={() => navigate("/institute")}
                        />
                        <QuickActionCard
                            title="Manage Users"
                            description="Create users and update their roles"
                            icon={<MdPeople size={22} />}
                            accent="violet"
                            onClick={() => navigate("/users")}
                        />
                    </div>
                </div>
            )}

            {/* Core catalog uploads — admin only */}
            {isAdmin && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Typography variant="overline" className="font-bold text-slate-500 tracking-wider">
                            Catalog Uploads
                        </Typography>
                    </div>
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
                </div>
            )}

            {/* Institutes table — admin only */}
            {isAdmin && (
            <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <MdSchool size={20} className="text-white" />
                            </div>
                            <div>
                                <Typography variant="h6" className="font-bold text-slate-900 leading-tight">
                                    Institutes Directory
                                </Typography>
                                <Typography variant="caption" className="text-slate-500">
                                    {loading ? (
                                        <Skeleton width={120} />
                                    ) : (
                                        `${institutes.length} institute${institutes.length !== 1 ? "s" : ""} registered`
                                    )}
                                </Typography>
                            </div>
                        </div>
                        <TextField
                            size="small"
                            placeholder="Search institutes…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="sm:w-72"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem" } }}
                        />
                        {isAdmin && (
                            <Button
                                variant="text"
                                endIcon={<MdArrowForward size={16} />}
                                onClick={() => navigate("/institute")}
                                sx={{
                                    borderRadius: "0.5rem",
                                    textTransform: "none",
                                    fontWeight: 600,
                                }}
                            >
                                View all
                            </Button>
                        )}
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
            )}
        </div>
    );
};
