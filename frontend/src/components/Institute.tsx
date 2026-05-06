import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import type { Institute as InstituteType } from "./types";
import { CircularProgress, Typography } from "@mui/material";
import { MdAdd, MdSearch, MdSchool, MdLocationOn, MdDomain, MdRefresh } from "react-icons/md";

const INSTITUTES_URL = "/institute/show-institute";

export const Institute = () => {
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    const [institutes, setInstitutes] = useState<InstituteType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axiosPrivate.get<InstituteType[]>(INSTITUTES_URL);
                if (!cancelled) setInstitutes(Array.isArray(res.data) ? res.data : []);
            } catch {
                if (!cancelled) setError("Failed to load institutes. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [axiosPrivate, tick]);

    const filtered = institutes.filter((i) => {
        const q = search.toLowerCase();
        return (
            !q ||
            i.name?.toLowerCase().includes(q) ||
            i.code?.toLowerCase().includes(q) ||
            i.city?.toLowerCase().includes(q) ||
            i.state?.toLowerCase().includes(q)
        );
    });

    const activeCount = institutes.filter((i) => i.isActive).length;

    return (
        <div className="w-full">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <Typography variant="h4" className="font-bold text-slate-900 mb-1">
                        Institutes
                    </Typography>
                    {!loading && (
                        <Typography variant="body2" color="text.secondary">
                            {institutes.length} registered · {activeCount} active
                        </Typography>
                    )}
                </div>
                <button
                    onClick={() => navigate("/create-institute")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
                >
                    <MdAdd size={18} />
                    New Institute
                </button>
            </div>

            {/* Search & refresh */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <MdSearch className="absolute left-3.5 top-3 text-slate-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Search by name, code, city or state…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
                <button
                    onClick={() => setTick((t) => t + 1)}
                    disabled={loading}
                    title="Refresh"
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 shadow-sm disabled:opacity-40"
                >
                    <MdRefresh size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Content area */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <CircularProgress />
                </div>
            ) : error ? (
                <div className="text-center py-16 bg-white rounded-xl border border-red-100 shadow-sm">
                    <p className="text-red-600 font-medium mb-3">{error}</p>
                    <button
                        onClick={() => setTick((t) => t + 1)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState hasSearch={search.length > 0} onCreateClick={() => navigate("/create-institute")} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((inst) => (
                        <InstituteCard
                            key={inst.id}
                            institute={inst}
                            onClick={() => navigate(`/institute/${inst.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InstituteCard = ({
    institute,
    onClick,
}: {
    institute: InstituteType;
    onClick?: () => void;
}) => {
    const deptCount = institute.departmentList?.length ?? 0;
    const progCount =
        institute.departmentList?.reduce((sum, d) => sum + (d.programsList?.length ?? 0), 0) ?? 0;

    return (
        <div
            onClick={onClick}
            className="group bg-white border border-slate-100 hover:border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
        >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

            <div className="p-6">
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors duration-300">
                        <MdSchool
                            size={22}
                            className="text-blue-600 group-hover:text-white transition-colors duration-300"
                        />
                    </div>
                    <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            institute.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
                        }`}
                    >
                        {institute.isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                {/* Name & code */}
                <h3 className="font-bold text-slate-900 text-base mb-0.5 leading-snug">{institute.name}</h3>
                {institute.code && (
                    <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide mb-4">
                        {institute.code}
                    </p>
                )}

                {/* Meta */}
                <div className="space-y-1.5 mb-5">
                    {(institute.city || institute.state) && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MdLocationOn size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                                {[institute.city, institute.state, institute.country]
                                    .filter(Boolean)
                                    .join(", ")}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MdDomain size={15} className="text-slate-400 shrink-0" />
                        <span>
                            {deptCount} dept{deptCount !== 1 ? "s" : ""}
                        </span>
                        {progCount > 0 && (
                            <span className="text-slate-400">
                                · {progCount} program{progCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>

                {/* Department chips */}
                {deptCount > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {institute.departmentList.slice(0, 4).map((dept) => (
                            <span
                                key={dept.id}
                                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                            >
                                {dept.code || dept.name}
                            </span>
                        ))}
                        {deptCount > 4 && (
                            <span className="text-xs text-slate-400 px-2 py-0.5">
                                +{deptCount - 4} more
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({
    hasSearch,
    onCreateClick,
}: {
    hasSearch: boolean;
    onCreateClick: () => void;
}) => (
    <div className="text-center py-28 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdSchool size={32} className="text-blue-400" />
        </div>
        <h3 className="text-slate-700 font-bold text-lg mb-2">
            {hasSearch ? "No institutes found" : "No institutes yet"}
        </h3>
        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            {hasSearch
                ? "Try a different search term or clear the filter."
                : "Get started by creating your first institute to manage departments and programs."}
        </p>
        {!hasSearch && (
            <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md"
            >
                <MdAdd size={18} />
                Create First Institute
            </button>
        )}
    </div>
);
